"use client";

import { useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";

type MeResponse = {
  user: { id: string; role: "USER" | "ADMIN" | "OWNER" } | null;
};

export function useCurrentUser() {
  return useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: async () => kyInstance.get("/api/me").json<MeResponse>(),
    staleTime: 60_000,
  });
}
