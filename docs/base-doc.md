# Cricket Scorecard Management System

## Technical Documentation — Core Technologies & Modules

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Technologies](#core-technologies)
3. [Core Modules](#core-modules)
4. [Technical Architecture View](#technical-architecture-view)
5. [Data Flow & Communication](#data-flow--communication)
6. [Notification System Design](#notification-system-design)

---

## Project Overview

The Cricket Scorecard Management System is a real-time web application designed to enable live ball-by-ball score entry, instant scorecard broadcasting, and event-driven push notifications to subscribed users. The system supports match management for local clubs, tournaments, and professional leagues with offline-first scoring capability and multi-device synchronization.

**Key Goals:**

- Real-time score updates delivered to all subscribers within 1–2 seconds
- Offline-capable scorer app with automatic sync on reconnect
- Granular push notification subscriptions (wickets, milestones, match events)
- Robust admin panel for tournament and match management
- Historical stats, player records, and partnership tracking

---

## Core Technologies

### Frontend Stack

#### React (Next.js 14 — App Router)

Next.js is the primary frontend framework. It enables server-side rendering for fast initial page loads on the public scorecard view, while the scorer dashboard runs as a client-side interactive app. The App Router supports route-based code splitting, layouts, and built-in API routes.

- Used for: Public scorecard display, scorer entry UI, admin panel, user profile pages
- Why Next.js over plain React: SSR for SEO on public match pages, built-in API routes, image optimization, and edge caching

#### TypeScript

All frontend and backend code is written in TypeScript for type safety. Cricket data structures (ball events, innings state, player records) are complex and deeply nested — TypeScript interfaces prevent runtime errors that would corrupt live match data.

#### Tailwind CSS

Utility-first CSS framework for building the UI. Enables rapid component styling without context-switching to separate stylesheets. Used across the scorer input panel, live scorecard display, and notification preference pages.

#### Socket.io Client

Handles the persistent WebSocket connection from the browser to the backend. Every time a scorer submits a ball event, the client receives the updated scorecard via the socket — no page refresh needed. Auto-reconnects if the connection drops.

#### Progressive Web App (PWA)

The scorer app is packaged as a PWA using Next.js's built-in service worker support. This enables:

- Installation on the scorer's phone like a native app
- Offline ball-by-ball entry stored in IndexedDB
- Background sync when connectivity is restored
- Push notification support on mobile browsers

---

### Backend Stack

#### Node.js + Express

The core application server. Handles REST API requests for match creation, team management, user authentication, and score history queries. Express middleware manages authentication, request validation, and error handling.

#### Socket.io Server

Runs alongside Express to manage WebSocket connections. When a scorer submits a ball event via REST, the backend processes it, saves to the database, then emits the updated match state to all clients subscribed to that match room. Redis pub/sub ensures this works across multiple server instances.

#### Redis (Upstash)

Redis serves two critical roles in this system:

1. **Live state cache** — The current match state (scorecard, current over, batting/bowling figures) is cached in Redis. All connected clients read from this cache rather than hitting the database on every ball, reducing latency.

2. **Pub/Sub bus** — When the backend runs on multiple server instances (horizontal scaling), Socket.io cannot broadcast across instances by default. Redis pub/sub bridges this — any instance that receives a ball event publishes it to Redis, and all instances subscribe and re-broadcast to their connected clients.

#### BullMQ

A Redis-backed job queue for processing asynchronous tasks such as sending push notifications, generating post-match stat summaries, and syncing offline scores. Prevents the main request-response cycle from being blocked by slow operations.

#### JWT Authentication

JSON Web Tokens are used for stateless authentication. Scorers, admins, and subscribers each have role-based tokens. The scorer token is scoped to a specific match — preventing unauthorized score entry.

---

### Database Layer

#### PostgreSQL (Neon / Supabase)

The primary relational database. Cricket match data is highly relational — players belong to teams, teams play in matches, ball events belong to overs, overs belong to innings. PostgreSQL enforces these relationships with foreign keys and handles complex aggregation queries for career statistics efficiently.

#### Prisma ORM

Type-safe database client for Node.js. Prisma generates TypeScript types from the database schema, so all database queries are auto-completed and type-checked. Migrations are version-controlled and safe to run in production.

#### IndexedDB (Browser — Offline)

When the scorer's device loses network connectivity, all ball events are stored locally in IndexedDB. On reconnect, the service worker replays buffered events to the server in order, with conflict detection to prevent duplicate entries.

---

### Notification Infrastructure

#### Firebase Cloud Messaging (FCM)

Google's cross-platform push notification service. FCM delivers notifications to Android apps, iOS apps, and web browsers using a single unified API. Each subscribed user receives a unique FCM device token stored in the database. When a match event occurs (wicket, milestone, match end), the backend sends payloads to all relevant tokens.

#### Web Push API

For browsers that support it natively (desktop Chrome, Firefox, Edge), the Web Push API delivers notifications without requiring a native app install. Used in combination with the PWA service worker to show match alerts even when the browser tab is closed.

#### Resend / SendGrid (Email)

For users who prefer email notifications — match summaries, scorecard links, and day-start reminders for ongoing Test matches are delivered via transactional email.

---

### Infrastructure & DevOps

| Service          | Purpose                                         |
| ---------------- | ----------------------------------------------- |
| Vercel           | Frontend hosting with edge caching and CDN      |
| Railway / Render | Node.js backend hosting with auto-deploy        |
| Neon / Supabase  | Managed PostgreSQL with connection pooling      |
| Upstash          | Serverless Redis for cache and pub/sub          |
| GitHub Actions   | CI/CD pipeline — lint, test, and deploy on push |
| Sentry           | Error monitoring and performance tracing        |

---

## Core Modules

### Module 1 — Match Engine (Scorecard Management)

The Match Engine is the heart of the application. It manages the complete lifecycle of a cricket match — from toss and team selection through to the final result. Every ball bowled is represented as an immutable event record in the database.

The engine tracks: current innings number, balls in the current over, runs scored per ball, wicket type and fielder involved, extras (wides, no-balls, byes, leg byes), and running totals. It continuously recalculates current run rate (CRR), required run rate (RRR), projected score, and partnership statistics.

The scorer submits one ball event at a time. The engine validates the event (e.g. a wide cannot also be a wicket of certain types), applies it to the match state, and broadcasts the updated state. Correction is supported — the scorer can reverse the last N balls with a mandatory reason logged for the audit trail.

**Supported formats:** T20, ODI (50-over), Test (multi-day), T10, and custom over counts for local club matches.

---

### Module 2 — Real-Time Scoring (Live Updates)

This module is responsible for delivering score updates to all connected clients within 1–2 seconds of a ball being entered. It uses a WebSocket connection (Socket.io) maintained between each viewer's browser and the backend server.

When a scorer submits a ball event, the flow is: REST API receives the ball → validates and saves to PostgreSQL → updates the Redis live-state cache → publishes a `match:update` event to the Redis pub/sub channel → all Socket.io server instances receive the event → each broadcasts to clients in that match's socket room.

Clients subscribe to a match room on page load. The scorecard UI updates reactively without any page refresh. The live over-by-over breakdown, current batsmen figures, current bowler figures, and required run rate all update in real time.

A dedicated "Live" indicator on the scorecard pulses green when the socket is connected, and turns amber with a reconnecting animation if connectivity is lost.

---

### Module 3 — Push Notification System

The notification system allows users to subscribe to match events and receive alerts on their devices. Each user configures their alert preferences per match or per team — choosing from: every ball, wickets only, milestones only (50s, 100s, 5-fors), match start/end, or a post-match summary only.

When a qualifying event occurs, the backend enqueues a notification job in BullMQ. The worker picks up the job, fetches all subscribed users and their FCM tokens, batches them into groups of 500 (FCM limit per request), and dispatches them via the Firebase Admin SDK. Delivery receipts are stored, and invalid/expired tokens are pruned automatically.

Notifications include the match context: score at the time, event description (e.g. "Kohli OUT for 87 — caught at mid-off"), and a deep link directly to the live scorecard.

---

### Module 4 — User Profiles & Subscription Management

Registered users have profiles with a subscription dashboard. From the dashboard, users can follow teams, tournaments, or individual matches. Each subscription has configurable alert levels to prevent notification fatigue.

Profile data includes: favourite teams, recent matches viewed, notification preferences per team, and a personal match history feed. Users can toggle web push notifications on/off per device, and separately manage email digest preferences.

Anonymous users can view all public scorecards without registering. Registration is required only for push notifications and personal match feeds.

---

### Module 5 — Player & Team Statistics

The statistics module aggregates ball-by-ball event data into meaningful career and match-level statistics. It runs as an asynchronous post-match job — triggered when the match engine marks a match as completed — so it never blocks live scoring.

Batting statistics tracked: runs, balls faced, 4s, 6s, strike rate, highest score, average, 50s, 100s, ducks. Bowling statistics tracked: wickets, runs conceded, overs bowled, economy rate, best bowling figures, 4-wicket and 5-wicket hauls. Partnership records: highest partnership by wicket, runs, and balls.

All statistics are queryable by format (T20 / ODI / Test), tournament, venue, and opponent. The module exposes a public API endpoint so scorecards can display career stats inline next to each player's name.

---

### Module 6 — Admin Panel & Scorer Tools

The admin panel is used by tournament organisers and match administrators. From here, admins can create tournaments, define participating teams, schedule matches, and assign scorer accounts to specific matches.

The scorer interface is a purpose-built ball entry UI. It presents large, tap-friendly buttons for: dot, 1, 2, 3, 4, 6, Wide, No Ball, Wicket (with sub-type selection). The current batsmen, current bowler, and over progress are always visible. Wickets trigger a fielder assignment workflow before the next ball can be entered.

One scorer per match holds the active token. A second device can be in shadow mode (read-only, for verification). Admins can revoke and reassign the scorer token if a device needs to be swapped mid-match.

DRS (Decision Review System) events, weather interruptions, D/L method target revisions, and Super Overs are all handled through the admin panel's match control interface.

---

## Technical Architecture View

```
┌─────────────────────────────────────────────────────┐
│                     Clients                         │
│                                                     │
│   Scorer App (PWA)    Viewer Browser    Mobile App  │
│        │                    │               │       │
└────────┼────────────────────┼───────────────┼───────┘
         │  REST + WebSocket  │               │ FCM Push
         ▼                    ▼               ▼
┌─────────────────────────────────────────────────────┐
│                  Backend (Node.js)                   │
│                                                     │
│   Express REST API         Socket.io Server         │
│        │                        │                   │
│        ▼                        ▼                   │
│   Match Engine            Redis Pub/Sub             │
│   Auth (JWT)              Live State Cache          │
│   BullMQ Workers                                    │
└──────────────┬──────────────────┬───────────────────┘
               │                  │
       ┌───────▼───────┐  ┌───────▼───────┐
       │  PostgreSQL   │  │    Redis      │
       │  (Prisma ORM) │  │  (Upstash)    │
       │               │  │               │
       │  Matches      │  │  Match state  │
       │  Ball events  │  │  Pub/sub bus  │
       │  Players      │  │  Session data │
       │  Users        │  │               │
       └───────────────┘  └───────────────┘
               │
       ┌───────▼───────┐
       │  Notification │
       │  Services     │
       │               │
       │  FCM (mobile) │
       │  Web Push     │
       │  Resend Email │
       └───────────────┘
```

---

## Data Flow & Communication

### Ball Entry Flow (Scorer → All Viewers)

```
1. Scorer taps "4" on scorer UI
2. POST /api/matches/:id/balls  →  Express validates ball event
3. Match Engine processes: updates innings state, recalculates CRR, RRR
4. Prisma writes BallEvent record to PostgreSQL
5. Redis SET match:<id>:state  →  updated scorecard JSON cached
6. Redis PUBLISH match:<id>:update  →  event sent to pub/sub channel
7. All Socket.io instances receive pub/sub message
8. socket.to('match:<id>').emit('scoreUpdate', newState)
9. All connected viewer browsers receive event
10. React scorecard component re-renders with new state
11. If ball qualifies (boundary milestone) → BullMQ job enqueued
12. BullMQ worker dispatches FCM push to subscribed users
```

### Offline Sync Flow (Scorer loses connectivity)

```
1. Service Worker detects network offline
2. Ball events continue to be stored in IndexedDB queue
3. "Offline" indicator appears in scorer UI (data is safe)
4. Network restored → Service Worker Background Sync fires
5. Queued events sent to POST /api/matches/:id/balls/batch
6. Server detects gap in sequence numbers → applies events in order
7. Duplicate detection: idempotency keys prevent double-counting
8. Redis and PostgreSQL updated → all viewers receive catch-up update
```

---

## Notification System Design

### Subscription Levels

| Level           | Description                     | Use Case                         |
| --------------- | ------------------------------- | -------------------------------- |
| All balls       | Every delivery result           | Dedicated match followers        |
| Wickets only    | Every dismissal                 | Casual fans tracking key players |
| Milestones      | 50s, 100s, 5-fors, match events | Low-frequency updates            |
| Match events    | Start, innings break, result    | Minimal interruption             |
| Post-match only | Final scorecard summary         | Stats-focused users              |

### Notification Payload Structure

```json
{
  "title": "WICKET — India vs Australia",
  "body": "Virat Kohli OUT for 87 — caught Starc b Cummins",
  "data": {
    "matchId": "match_abc123",
    "eventType": "WICKET",
    "score": "IND 187/4 (32.2 ov)",
    "deepLink": "/matches/match_abc123/live"
  },
  "icon": "/icons/cricket-notification.png",
  "badge": "/icons/badge-72.png"
}
```

### Token Management

FCM device tokens expire and rotate. The system handles this by storing tokens with a `lastValidAt` timestamp. On every successful notification delivery, the timestamp is updated. Tokens older than 60 days without activity are pruned. FCM returns `UNREGISTERED` errors for invalid tokens — these are immediately deleted from the database on receipt.

---

_Document version 1.0 — Cricket Scorecard Management System_
_Generated as part of the initial technical planning phase_
