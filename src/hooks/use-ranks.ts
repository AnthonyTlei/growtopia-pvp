"use client";

import { useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import type { PlayerRanking } from "@/components/rankings/players-rankings-table";

export function useRanks(limit?: number) {
  return useQuery<PlayerRanking[]>({
    queryKey: ["ranks", limit],
    queryFn: async () => {
      
      const allPlayers = await kyInstance.get("/api/ranks").json<PlayerRanking[]>();

    
      return limit ? allPlayers.slice(0, limit) : allPlayers;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
