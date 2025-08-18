"use client";

import { useMatchesInfinite } from "@/hooks/use-matches";
import MatchCard from "./match-card";
import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function MatchesList() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMatchesInfinite({ limit: 25, order: "desc" });

  const matches = useMemo(
    () =>
      data?.pages
        .flatMap((p) => p.items)
        .filter(
          (item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx
        ) ?? [],
    [data]
  );

  if (isLoading && matches.length === 0)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 w-full">
        <div className="flex flex-col items-center justify-center rounded-md border p-4 shadow">
          <p>Loading matches...</p>
        </div>
      </div>
    );

  if (isError)
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
    <div className="flex h-full w-full flex-col items-stretch">
      <ScrollArea
        className="w-full max-h-[80dvh] rounded-md border p-2 pr-4"
        type="hover"
      >
        <div
          data-scrollable
          className="grid h-fit w-full grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>

        <div className="w-full flex items-center justify-center py-3">
          {hasNextPage ? (
            <button
              className="px-4 py-2 rounded border shadow-sm disabled:opacity-50"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          ) : (
            <div className="text-sm opacity-70">No more matches to show.</div>
          )}
        </div>

        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}
