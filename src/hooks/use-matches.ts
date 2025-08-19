import kyInstance from "@/lib/ky";
import type { MatchesBatch } from "@/lib/matches";
import type { CreateMatchValues } from "@/lib/validation";
import type { MatchWithParticipants } from "@/types/prisma-includes";
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

/** --- Helper: push `created` into every infinite cache (first page), dedupe by id --- */
function pushIntoInfiniteCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  created: MatchWithParticipants
) {
  const matches = queryClient.getQueriesData<InfiniteData<MatchesBatch>>({
    queryKey: ["matches", "infinite"],
  });

  for (const [key, data] of matches) {
    if (!data || !data.pages || data.pages.length === 0) continue;

    const k = Array.isArray(key) ? key : [];
    const order = (k[3] as "asc" | "desc" | undefined) ?? "desc";

    const [first, ...rest] = data.pages;

    const without = first.items.filter((m) => m.id !== created.id);

    const newFirst =
      order === "asc"
        ? { ...first, items: [...without, created] }
        : { ...first, items: [created, ...without] };

    queryClient.setQueryData<InfiniteData<MatchesBatch>>(key, {
      ...data,
      pages: [newFirst, ...rest],
    });
  }
}

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

/** --- API call --- */
async function createMatchRequest(
  values: CreateMatchValues
): Promise<MatchWithParticipants> {
  try {
    return await kyInstance
      .post("/api/matches/create", { json: values })
      .json<MatchWithParticipants>();
  } catch (err) {
    if (err instanceof HTTPError) {
      let message = `${err.response.status} ${err.response.statusText}`;
      try {
        const data = (await err.response.clone().json()) as {
          message?: string;
        };
        if (data?.message) message = data.message;
      } catch {
        try {
          const txt = await err.response.text();
          if (txt) message = txt;
        } catch {}
      }
      throw new Error(message);
    }
    throw err;
  }
}

export function useCreateMatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMatchRequest,

    onSuccess: (created) => {
      pushIntoInfiniteCaches(queryClient, created);

      queryClient.setQueryData<MatchWithParticipants>(
        ["matches", created.id],
        created
      );

      const simple = queryClient.getQueryData<MatchWithParticipants[]>([
        "matches",
        undefined,
      ]);
      if (simple) {
        const filtered = simple.filter((m) => m.id !== created.id);
        queryClient.setQueryData<MatchWithParticipants[]>(
          ["matches", undefined],
          [created, ...filtered]
        );
      }

      toast.success("Match created");
    },

    onError: (error: unknown) => {
      if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create match");
      }
      console.error("createMatch mutation failed:", error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", "infinite"] });
    },
  });
}
