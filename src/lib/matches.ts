import {
  matchesWithParticipants,
  MatchWithParticipants,
} from "@/types/prisma-includes";
import { prisma } from "./prisma";
import { CreateMatchValues } from "./validation";
import { applyElo, computeDelta, DEFAULT_ELO, getK, MIN_ELO } from "./elo";
import { MatchStatus, Prisma, Role } from "@prisma/client";

export type MatchesBatch = {
  items: MatchWithParticipants[];
  nextCursor: { id: string; createdAt: string } | null;
  hasNext: boolean;
};

type GetMatchesInfiniteArgs = {
  cursorId?: string;
  limit?: number; // default 20, max 100
  order?: "asc" | "desc";
};

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

type DbClient = Prisma.TransactionClient | typeof prisma;

function outcomesFromScores(
  aScore: number,
  bScore: number,
  winnerId?: string | null,
  aUserId?: string,
  bUserId?: string
): [0 | 0.5 | 1, 0 | 0.5 | 1] {
  if (winnerId && aUserId && bUserId) {
    if (winnerId === aUserId) return [1, 0];
    if (winnerId === bUserId) return [0, 1];
  }
  if (aScore > bScore) return [1, 0];
  if (aScore < bScore) return [0, 1];
  return [0.5, 0.5];
}

/** Guard: no other rated active (pending/in-progress) match between the same pair */
async function assertNoDuplicateActiveRated(
  tx: DbClient,
  {
    excludeMatchId,
    a,
    b,
  }: {
    excludeMatchId?: string;
    a: string;
    b: string;
  }
) {
  const [u1, u2] = [a, b].sort();
  const conflict = await tx.match.findFirst({
    where: {
      id: excludeMatchId ? { not: excludeMatchId } : undefined,
      rated: true,
      status: { in: [MatchStatus.PENDING] },
      AND: [
        { participants: { some: { userId: u1 } } },
        { participants: { some: { userId: u2 } } },
        { participants: { every: { userId: { in: [u1, u2] } } } },
      ],
    },
    select: { id: true },
  });

  if (conflict) {
    throw new Error(
      "There’s already a rated match pending between these two players. Finish or cancel it before creating another."
    );
  }
}

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
    take: safeLimit + 1,
    skip: cursorId ? 1 : 0,
    cursor: cursorId ? { id: cursorId } : undefined,
    orderBy,
    include: matchesWithParticipants,
  });

  const hasNext = items.length > safeLimit;
  if (hasNext) items.pop();

  const last = items[items.length - 1];
  const nextCursor =
    hasNext && last
      ? { id: last.id, createdAt: last.createdAt.toISOString() }
      : null;

  return { items, nextCursor, hasNext };
}

/**
 * Create Match function + ELO handling
 *
 */
export async function createMatch(
  values: CreateMatchValues,
  creatorId?: string
) {
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
        select: { id: true, elo: true, ratedMatchesCount: true },
      });
      if (users.length !== userIds.length) {
        throw new Error("One or more players do not exist.");
      }
      const byId = new Map(
        users.map((u) => [
          u.id,
          {
            elo: u.elo ?? DEFAULT_ELO,
            ratedMatchesCount: u.ratedMatchesCount ?? 0,
          },
        ])
      );

      if (rated) {
        await assertNoDuplicateActiveRated(tx, {
          a: userIds[0],
          b: userIds[1],
        });
      }

      let creatorExists = false;
      if (creatorId) {
        const creator = await tx.user.findUnique({
          where: { id: creatorId },
          select: { id: true },
        });
        creatorExists = !!creator;
      }

      const created = await tx.match.create({
        data: {
          status,
          rated,
          ...(completedAt ? { completedAt } : {}),
          ...(winnerId ? { winner: { connect: { id: winnerId } } } : {}),
          ...(creatorId && creatorExists
            ? { createdBy: { connect: { id: creatorId } } }
            : {}),
          participants: {
            create: participants.map((p) => ({
              user: { connect: { id: p.userId } },
              score: p.score ?? 0,
            })),
          },
        },
        include: {
          participants: {
            select: { matchId: true, userId: true, score: true },
            orderBy: { userId: "asc" },
          },
          winner: { select: { id: true } },
        },
      });

      const [pA, pB] = created.participants;

      const aUser = byId.get(pA.userId);
      const bUser = byId.get(pB.userId);
      if (!aUser || !bUser) {
        throw new Error("Unexpected: missing user stats for Elo preview.");
      }

      const [Sa, Sb] = outcomesFromScores(
        pA.score ?? 0,
        pB.score ?? 0,
        created.winner?.id ?? undefined,
        pA.userId,
        pB.userId
      );

      const Ka = getK(aUser.ratedMatchesCount, aUser.elo);
      const Kb = getK(bUser.ratedMatchesCount, bUser.elo);

      const dA = computeDelta(aUser.elo, bUser.elo, Sa, Ka);
      const dB = computeDelta(bUser.elo, aUser.elo, Sb, Kb);

      const aPreview = Math.max(MIN_ELO, aUser.elo + dA);
      const bPreview = Math.max(MIN_ELO, bUser.elo + dB);

      await tx.matchParticipant.update({
        where: { matchId_userId: { matchId: created.id, userId: pA.userId } },
        data: { eloBefore: aUser.elo, eloAfter: aPreview, eloDelta: dA },
      });
      await tx.matchParticipant.update({
        where: { matchId_userId: { matchId: created.id, userId: pB.userId } },
        data: { eloBefore: bUser.elo, eloAfter: bPreview, eloDelta: dB },
      });

      return created;
    });

    if (rated && status === "COMPLETED") {
      await applyElo({ matchId: match.id });
    }

    const full = await prisma.match.findUnique({
      where: { id: match.id },
      include: matchesWithParticipants,
    });
    if (!full) throw new Error("Match not found after creation.");
    return full;
  } catch (err) {
    console.error("createMatch failed:", err);
    if (err instanceof Error && err.message) {
      throw err;
    }
    throw new Error("Failed to create match. Please try again.");
  }
}

export async function updateMatch(args: {
  id: string;
  values: CreateMatchValues;
  actorId: string;
  actorRole: Role;
}): Promise<MatchWithParticipants> {
  const { id, values, actorId, actorRole } = args;

  try {
    const { status, rated = false, participants, winnerId } = values;

    if (!participants || participants.length !== 2) {
      throw new Error("A match must include exactly two participants.");
    }
    const ids = participants.map((p) => p.userId);
    if (winnerId && !ids.includes(winnerId)) {
      throw new Error("Winner must be one of the participants.");
    }

    const existing = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        rated: true,
        createdById: true,
      },
    });
    if (!existing) throw new Error("Match not found.");

    const isAdmin = actorRole === Role.ADMIN || actorRole === Role.OWNER;
    const isCreator = existing.createdById && existing.createdById === actorId;

    if (!isAdmin) {
      if (!isCreator) {
        throw new Error(
          "Forbidden: only the match creator can edit this match."
        );
      }
      if (existing.status !== MatchStatus.PENDING) {
        throw new Error("Only pending matches can be edited.");
      }
    }

    const willBeActive = status === MatchStatus.PENDING;

    if (rated && willBeActive) {
      await prisma.$transaction(async (tx) => {
        await assertNoDuplicateActiveRated(tx, {
          excludeMatchId: id,
          a: ids[0],
          b: ids[1],
        });
      });
    }

    const completedAt = status === MatchStatus.COMPLETED ? new Date() : null;

    const updated = await prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, elo: true, ratedMatchesCount: true },
      });
      if (users.length !== ids.length) {
        throw new Error("One or more players do not exist.");
      }
      const byId = new Map(
        users.map((u) => [
          u.id,
          {
            elo: u.elo ?? DEFAULT_ELO,
            ratedMatchesCount: u.ratedMatchesCount ?? 0,
          },
        ])
      );

      await tx.match.update({
        where: { id },
        data: {
          status,
          rated,
          completedAt,
          ...(winnerId
            ? { winner: { connect: { id: winnerId } } }
            : { winner: { disconnect: true } }),
        },
      });

      await tx.matchParticipant.deleteMany({ where: { matchId: id } });
      await tx.matchParticipant.createMany({
        data: participants.map((p) => ({
          matchId: id,
          userId: p.userId,
          score: p.score ?? 0,
        })),
      });

      const [pa, pb] = participants
        .map((p) => ({
          id: p.userId,
          score: p.score ?? 0,
          stats: byId.get(p.userId)!,
        }))
        .sort((a, b) => (a.id < b.id ? -1 : 1));

      const [Sa, Sb] = outcomesFromScores(
        pa.score,
        pb.score,
        winnerId ?? undefined,
        pa.id,
        pb.id
      );

      const Ka = getK(pa.stats.ratedMatchesCount, pa.stats.elo);
      const Kb = getK(pb.stats.ratedMatchesCount, pb.stats.elo);

      const dA = computeDelta(pa.stats.elo, pb.stats.elo, Sa, Ka);
      const dB = computeDelta(pb.stats.elo, pa.stats.elo, Sb, Kb);

      const aPreview = Math.max(MIN_ELO, pa.stats.elo + dA);
      const bPreview = Math.max(MIN_ELO, pb.stats.elo + dB);

      await tx.matchParticipant.update({
        where: { matchId_userId: { matchId: id, userId: pa.id } },
        data: { eloBefore: pa.stats.elo, eloAfter: aPreview, eloDelta: dA },
      });
      await tx.matchParticipant.update({
        where: { matchId_userId: { matchId: id, userId: pb.id } },
        data: { eloBefore: pb.stats.elo, eloAfter: bPreview, eloDelta: dB },
      });

      return tx.match.findUnique({
        where: { id },
        include: matchesWithParticipants,
      });
    });

    if (rated && status === MatchStatus.COMPLETED) {
      await applyElo({ matchId: id });
    }

    const full = await prisma.match.findUnique({
      where: { id },
      include: matchesWithParticipants,
    });
    if (!full) throw new Error("Match not found after update.");
    return full;
  } catch (err) {
    console.error("updateMatch failed:", err);
    if (err instanceof Error && err.message) throw err;
    throw new Error("Failed to update match. Please try again.");
  }
}
