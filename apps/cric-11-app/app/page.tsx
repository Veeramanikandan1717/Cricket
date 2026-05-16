import Link from "next/link";
import { AppShell, StatCard } from "@cricket/ui";

export default function AdminHome() {
  return (
    <AppShell title="Cricket Admin Console" subtitle="Match ops, player moderation, tournament controls">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Pending Match Updates" value="6" />
        <StatCard label="Player Change Requests" value="14" />
        <StatCard label="Tournament Rulesets" value="4" />
      </div>
      <div className="mt-6 flex gap-2">
        <Link href="/matches" className="rounded-md bg-black px-3 py-2 text-white">
          Manage Matches
        </Link>
        <Link href="/players" className="rounded-md bg-black px-3 py-2 text-white">
          Manage Players
        </Link>
        <Link href="/tournaments" className="rounded-md bg-black px-3 py-2 text-white">
          Manage Tournaments
        </Link>
      </div>
    </AppShell>
  );
}
