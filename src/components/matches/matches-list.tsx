"use client";

import { useMatchesQuery } from "@/hooks/use-matches";
import MatchCard from "./match-card";

export default function MatchesList() {
  const { data: matches, isLoading, isError } = useMatchesQuery();

  if (isLoading)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 w-full">
        <div className="flex flex-col items-center justify-center rounded-md border p-4 shadow">
          <p>Loading matches...</p>
        </div>
      </div>
    );

  if (isError || !matches)
    return (
      <div className="flex flex-col items-center justify-center rounded-md border p-4 shadow">
        <p>Failed to load matches.</p>
      </div>
    );

  if (matches.length === 0)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 w-full">
        <div className="flex flex-col items-center justify-center rounded-md border p-4 shadow">
          <p>No matches found.</p>
        </div>
      </div>
    );

  return (
    <div className="flex h-full flex-col items-center justify-start gap-4 w-full">
      <div className="grid h-fit w-full grid-cols-1 gap-4 lg:grid-cols-2">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}
