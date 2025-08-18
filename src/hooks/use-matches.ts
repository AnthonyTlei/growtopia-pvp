import kyInstance from "@/lib/ky";
import { CreateMatchValues } from "@/lib/validation";
import { MatchWithParticipants } from "@/types/prisma-includes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HTTPError } from "ky";
import { toast } from "sonner";

async function fetchMatches(): Promise<MatchWithParticipants[]> {
  const url = "/api/matches";
  return kyInstance.get(url).json();
}

async function createMatchRequest(
  values: CreateMatchValues
): Promise<MatchWithParticipants> {
  const fd = new FormData();
  fd.set("status", values.status);
  fd.set("rated", String(values.rated ?? false));
  fd.set("participants", JSON.stringify(values.participants));
  if (values.winnerId) fd.set("winnerId", values.winnerId);
  // return kyInstance.post("/api/matches/create", { body: fd }).json();
  return kyInstance.post("/api/matches/create", { json: values }).json();
}

export function useMatchesQuery(matchId?: string) {
  const queryClient = useQueryClient();
  return useQuery<MatchWithParticipants[]>({
    queryKey: ["matches", matchId],
    queryFn: async () => {
      const cachedMatches = queryClient.getQueryData<MatchWithParticipants[]>([
        "matches",
        undefined,
      ]);
      if (matchId) {
        if (cachedMatches) {
          const foundStore = cachedMatches?.find(
            (match) => match.id === matchId
          );
          if (foundStore) {
            return [foundStore];
          }
        }
        const matches = await fetchMatches();
        return matches.filter((m) => m.id === matchId);
      }

      if (cachedMatches) {
        return cachedMatches;
      }

      return fetchMatches();
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}

export function useCreateMatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMatchRequest,
    onSuccess: (created) => {
      queryClient.setQueryData<MatchWithParticipants[]>(
        ["matches", undefined],
        (prev) => {
          if (!prev) return [created];
          const filtered = prev.filter((m) => m.id !== created.id);
          return [created, ...filtered];
        }
      );
      queryClient.setQueryData<MatchWithParticipants[]>(
        ["matches", created.id],
        [created]
      );
    },
    onError: async (error: unknown) => {
      if (error instanceof HTTPError) {
        try {
          const data = await error.response.clone().json();
          toast.error(data?.message ?? "Request failed");
          console.error("Mutation failed:", data);
          return;
        } catch {
          toast.error(`${error.response.status} ${error.response.statusText}`);
        }
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create match");
      }
    },
  });
}
