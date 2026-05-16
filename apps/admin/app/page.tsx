import Link from "next/link";
import { AppShell, StatCard } from "@cricket/ui";
import { LiveScorecardCard } from "@/features/matches/components/LiveScorecardCard";

export default function Home() {
  return (
    <AppShell title="Cricket Hub" subtitle="Scorecards, players and tournaments">
      <div className="grid gap-4 md:grid-cols-3">
        <LiveScorecardCard matchId="match-001" />
        <StatCard label="Tracked Tournaments" value="12" hint="Across domestic and league" />
        <StatCard label="Players Indexed" value="1,280" hint="With split-format stats" />
      </div>

      <nav className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link className="rounded-md bg-black px-3 py-2 text-white" href="/players/virat-kohli">
          Player Profile
        </Link>
        <Link className="rounded-md bg-black px-3 py-2 text-white" href="/matches/match-001">
          Live Scorecard
        </Link>
        <Link
          className="rounded-md bg-black px-3 py-2 text-white"
          href="/tournaments/ipl-2026/points-table"
        >
          Tournament Points Table
        </Link>
      </nav>
    </AppShell>
  );
}
