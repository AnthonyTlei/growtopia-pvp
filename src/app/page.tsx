"use client";

import { useRanks } from "@/hooks/use-ranks";
import { useRecentMatches } from "@/hooks/use-recent-matches";
import MatchCard from "@/components/matches/match-card";
import TopPlayersCards from "@/components/rankings/top-players-cards";

export default function HomePage() {
  const { data: ranks = [], isLoading: ranksLoading } = useRanks(3);
  const { data: matches = [], isLoading: matchesLoading } = useRecentMatches(3);
  console.log("Ranks data:", ranks);
  
  console.log("Recent matches data:", matches);

  const loading = ranksLoading || matchesLoading;

  const top3Ranks = ranks
    .slice() // copy to avoid mutating original
    .sort((a, b) => b.elo - a.elo)
    .slice(0, 3);

  return (
    <main className="w-full h-full p-6 flex flex-col gap-8">
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <>
          {/* Top 3 Players Podium */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-center">TOP PVPERS</h2>
            {top3Ranks.length > 0 ? (
              <TopPlayersCards players={top3Ranks} />
            ) : (
              <p className="text-gray-500 text-center">No players found.</p>
            )}
          </section>

          {/* Recent Matches */}
          <section>
            <h2 className="text-xl font-bold mb-4">Recent Matches</h2>
            {matches.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent matches.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
