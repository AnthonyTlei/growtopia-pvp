import kyInstance from "@/lib/ky";
import { MatchesBatch } from "@/lib/matches";
import { CreateMatchValues } from "@/lib/validation";
import { MatchWithParticipants } from "@/types/prisma-includes";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { HTTPError } from "ky";
import { toast } from "sonner";

type Cursor = { id: string; createdAt: string } | null;

type Params = {
  limit?: number;
  order?: "asc" | "desc";
};

export function useMatchesInfinite({
  limit = 20,
  order = "desc",
}: Params = {}) {
  return useInfiniteQuery<
    MatchesBatch,
    Error,
    InfiniteData<MatchesBatch>,
    [string, string, number, string],
    Cursor
  >({
    queryKey: ["matches", "infinite", limit, order],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const searchParams: Record<string, string> = {
        limit: String(limit),
        order,
      };
      if (pageParam?.id) searchParams.cursorId = pageParam.id;

      return kyInstance
        .get("/api/matches", { searchParams })
        .json<MatchesBatch>();
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.nextCursor : undefined,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

async function createMatchRequest(
  values: CreateMatchValues
): Promise<MatchWithParticipants> {
  const fd = new FormData();
  fd.set("status", values.status);
  fd.set("rated", String(values.rated ?? false));
  fd.set("participants", JSON.stringify(values.participants));
  if (values.winnerId) fd.set("winnerId", values.winnerId);
  return kyInstance.post("/api/matches/create", { json: values }).json();
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
