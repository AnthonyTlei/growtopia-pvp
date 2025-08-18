import {
  matchesWithParticipants,
  MatchWithParticipants,
} from "@/types/prisma-includes";
import { prisma } from "./prisma";
import { CreateMatchValues } from "./validation";

export type MatchesBatch = {
  items: MatchWithParticipants[];
  nextCursor: { id: string; createdAt: string } | null;
  hasNext: boolean;
};

type GetMatchesInfiniteArgs = {
  cursorId?: string;
  limit?: number; // default 20, max 100
  order?: "asc" | "desc"; // default "desc" (newest first)
};

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

/**
 * Infinite, cursor-based listing. O(1) per page (no OFFSET).
 * Stable ordering: createdAt + id as tiebreaker.
 */
export async function getMatchesInfinite({
  cursorId,
  limit = DEFAULT_LIMIT,
  order = "desc",
}: GetMatchesInfiniteArgs = {}): Promise<MatchesBatch> {
  const safeLimit = Math.max(1, Math.min(limit, MAX_LIMIT));
  const orderBy =
    order === "asc"
      ? [{ createdAt: "asc" as const }, { id: "asc" as const }]
      : [{ createdAt: "desc" as const }, { id: "desc" as const }];

  const items = await prisma.match.findMany({
    take: safeLimit + 1, // fetch one extra to detect "hasNext"
    skip: cursorId ? 1 : 0, // skip the cursor row itself
    cursor: cursorId ? { id: cursorId } : undefined, // cursor must be unique
    orderBy,
    include: matchesWithParticipants,
  });

  const hasNext = items.length > safeLimit;
  if (hasNext) items.pop(); // remove the lookahead record

  const last = items[items.length - 1];
  const nextCursor =
    hasNext && last
      ? { id: last.id, createdAt: last.createdAt.toISOString() }
      : null;

  return { items, nextCursor, hasNext };
}

export async function createMatch(values: CreateMatchValues) {
  try {
    const { status, rated = false, participants, winnerId } = values;

    if (!participants || participants.length !== 2) {
      throw new Error("A match must include exactly two participants.");
    }

    if (winnerId && !participants.some((p) => p.userId === winnerId)) {
      throw new Error("Winner must be one of the participants.");
    }

    const completedAt = status === "COMPLETED" ? new Date() : null;

    const match = await prisma.$transaction(async (tx) => {
      const userIds = participants.map((p) => p.userId);
      const users = await tx.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true },
      });
      if (users.length !== userIds.length)
        throw new Error("One or more players do not exist.");

      const created = await tx.match.create({
        data: {
          status,
          rated,
          ...(winnerId ? { winnerId } : {}),
          ...(completedAt ? { completedAt } : {}),
          participants: {
            create: participants.map((p) => ({
              userId: p.userId,
              score: p.score ?? 0,
            })),
          },
        },
        include: matchesWithParticipants,
      });

      return created;
    });

    return match;
  } catch (err) {
    console.error("createMatch failed:", err);
    throw new Error("Failed to create match. Please try again.");
  }
}
