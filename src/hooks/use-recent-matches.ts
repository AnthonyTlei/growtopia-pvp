// src/hooks/use-recent-matches.ts
import { useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import type { MatchWithParticipants } from "@/types/prisma-includes";

export function useRecentMatches(limit = 3) {
  return useQuery<MatchWithParticipants[]>({
    queryKey: ["recent-matches", limit],
    queryFn: async () => {
      const data = await kyInstance
        .get("/api/matches", { searchParams: { limit, order: "desc" } })
        .json<{ items: MatchWithParticipants[] }>();

      console.log("Raw matches API response:", data);

      if (data && Array.isArray(data.items)) {
        console.log("Parsed matches array:", data.items);
        return data.items.slice(0, limit); // Ensure we only return the top N matches
      }

      console.error("Unexpected matches response:", data);
      return [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
