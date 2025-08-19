import { prisma } from "@/lib/prisma";
import { MatchStatus } from "@prisma/client";

export const DEFAULT_ELO = 1200;
export const MIN_ELO = 100;

export function getK(ratedMatchesCount: number, rating: number): number {
  if (rating >= 2400) return 10;
  if (ratedMatchesCount < 30) return 40; // provisional
  return 20;
}

export function expectedScore(ra: number, rb: number): number {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

export function computeDelta(
  ra: number,
  rb: number,
  outcomeA: 0 | 0.5 | 1,
  kA: number
): number {
  const ea = expectedScore(ra, rb);
  return Math.round(kA * (outcomeA - ea));
}

/**
 * Derive outcomes for a 1v1 match from winnerId or scores.
 * Returns [Sa, Sb] where S ∈ {1, 0.5, 0}.
 */
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

type ApplyOptions = { matchId: string };

/**
 * Apply Elo for a rated, COMPLETED match. Idempotent & race-safe.
 * - First "claims" the apply via updateMany (guarding concurrent calls)
 * - Then loads the match and computes deltas
 * - Stores eloBefore/after/delta on MatchParticipant
 * - Updates User.elo and ratedMatchesCount
 */
export async function applyElo({ matchId }: ApplyOptions) {
  return prisma.$transaction(async (tx) => {
    // Claim: only proceed if not yet applied, rated and completed.
    const claimed = await tx.match.updateMany({
      where: {
        id: matchId,
        rated: true,
        status: MatchStatus.COMPLETED,
        ratingAppliedAt: null,
      },
      data: { ratingAppliedAt: new Date() },
    });

    if (claimed.count === 0) {
      // Already applied or not eligible; return current view.
      return tx.match.findUnique({
        where: { id: matchId },
        include: {
          participants: {
            include: { user: { select: { id: true, ign: true, elo: true } } },
            orderBy: { userId: "asc" },
          },
        },
      });
    }

    // Load after claim to see latest state within the tx.
    const match = await tx.match.findUnique({
      where: { id: matchId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                elo: true,
                ratedMatchesCount: true,
                ign: true,
              },
            },
          },
          orderBy: { userId: "asc" }, // deterministic order
        },
      },
    });

    if (!match) throw new Error("Match not found");
    if (match.participants.length !== 2) {
      throw new Error("Elo requires exactly 2 participants");
    }

    const [pa, pb] = match.participants;
    const aId = pa.user.id;
    const bId = pb.user.id;
    const aElo = pa.user.elo ?? DEFAULT_ELO;
    const bElo = pb.user.elo ?? DEFAULT_ELO;
    const aCount = pa.user.ratedMatchesCount ?? 0;
    const bCount = pb.user.ratedMatchesCount ?? 0;

    const [Sa, Sb] = outcomesFromScores(
      pa.score ?? 0,
      pb.score ?? 0,
      match.winnerId ?? undefined,
      aId,
      bId
    );

    const Ka = getK(aCount, aElo);
    const Kb = getK(bCount, bElo);

    const dA = computeDelta(aElo, bElo, Sa, Ka);
    const dB = computeDelta(bElo, aElo, Sb, Kb);

    const aNew = Math.max(MIN_ELO, aElo + dA);
    const bNew = Math.max(MIN_ELO, bElo + dB);

    // Persist participant snapshots
    await tx.matchParticipant.update({
      where: { matchId_userId: { matchId: match.id, userId: aId } },
      data: { eloBefore: aElo, eloAfter: aNew, eloDelta: dA },
    });
    await tx.matchParticipant.update({
      where: { matchId_userId: { matchId: match.id, userId: bId } },
      data: { eloBefore: bElo, eloAfter: bNew, eloDelta: dB },
    });

    // Update users
    await tx.user.update({
      where: { id: aId },
      data: { elo: aNew, ratedMatchesCount: { increment: 1 } },
    });
    await tx.user.update({
      where: { id: bId },
      data: { elo: bNew, ratedMatchesCount: { increment: 1 } },
    });

    // Return updated snapshot
    return tx.match.findUnique({
      where: { id: matchId },
      include: {
        participants: {
          include: { user: { select: { id: true, ign: true, elo: true } } },
          orderBy: { userId: "asc" },
        },
      },
    });
  });
}

/**
 * Revert Elo for a previously applied match. Idempotent & race-safe.
 * - First "claims" the revert via updateMany
 * - Reads stored eloDelta on participants
 * - Reverses the deltas and clamps ratedMatchesCount to ≥ 0
 */
export async function revertElo({ matchId }: ApplyOptions) {
  return prisma.$transaction(async (tx) => {
    // Claim revert: ensure it was applied and not already reverted.
    const claimed = await tx.match.updateMany({
      where: {
        id: matchId,
        ratingAppliedAt: { not: null },
        ratingRevertedAt: null,
      },
      data: { ratingRevertedAt: new Date() },
    });

    if (claimed.count === 0) {
      // Nothing to revert or already reverted; return current view.
      return tx.match.findUnique({
        where: { id: matchId },
        include: {
          participants: {
            include: { user: { select: { id: true, ign: true, elo: true } } },
            orderBy: { userId: "asc" },
          },
        },
      });
    }

    const match = await tx.match.findUnique({
      where: { id: matchId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, elo: true, ratedMatchesCount: true } },
          },
          orderBy: { userId: "asc" },
        },
      },
    });

    if (!match) throw new Error("Match not found");

    const [pa, pb] = match.participants;
    if (!pa || !pb)
      throw new Error("Elo revert requires exactly 2 participants");
    if (pa.eloDelta == null || pb.eloDelta == null) {
      throw new Error("Cannot revert: missing Elo deltas");
    }

    const aCurr = pa.user.elo ?? DEFAULT_ELO;
    const bCurr = pb.user.elo ?? DEFAULT_ELO;
    const aCount = pa.user.ratedMatchesCount ?? 0;
    const bCount = pb.user.ratedMatchesCount ?? 0;

    // Reverse deltas and clamp to floor & non-negative counts
    await tx.user.update({
      where: { id: pa.user.id },
      data: {
        elo: Math.max(MIN_ELO, aCurr - pa.eloDelta),
        ratedMatchesCount: Math.max(0, aCount - 1),
      },
    });
    await tx.user.update({
      where: { id: pb.user.id },
      data: {
        elo: Math.max(MIN_ELO, bCurr - pb.eloDelta),
        ratedMatchesCount: Math.max(0, bCount - 1),
      },
    });

    // Return updated snapshot
    return tx.match.findUnique({
      where: { id: matchId },
      include: {
        participants: {
          include: { user: { select: { id: true, ign: true, elo: true } } },
          orderBy: { userId: "asc" },
        },
      },
    });
  });
}

/**
 * Returns the expected +/- Elo for A and B in each outcome (win/lose/draw),
 * given current ratings and K factors. Pure function; does not touch DB.
 */
export function previewEloOutcomesByNumbers(
  aElo: number,
  aCount: number,
  bElo: number,
  bCount: number
) {
  const Ka = getK(aCount, aElo);
  const Kb = getK(bCount, bElo);
  const eA = expectedScore(aElo, bElo);
  const eB = expectedScore(bElo, aElo);

  const a = {
    win: Math.round(Ka * (1 - eA)),
    draw: Math.round(Ka * (0.5 - eA)),
    lose: Math.round(Ka * (0 - eA)),
  };
  const b = {
    win: Math.round(Kb * (1 - eB)),
    draw: Math.round(Kb * (0.5 - eB)),
    lose: Math.round(Kb * (0 - eB)),
  };

  return { A: a, B: b };
}

/**
 * Convenience: Load two users and return preview deltas for both.
 * Does NOT write anything. Safe to call for PENDING matches.
 */
export async function previewEloForUsers(userAId: string, userBId: string) {
  const users = await prisma.user.findMany({
    where: { id: { in: [userAId, userBId] } },
    select: { id: true, elo: true, ratedMatchesCount: true },
  });
  if (users.length !== 2) throw new Error("Both users must exist.");

  // deterministically assign A/B by id to keep UI stable
  const [ua, ub] = [...users].sort((x, y) => x.id.localeCompare(y.id));
  const { A, B } = previewEloOutcomesByNumbers(
    ua.elo ?? DEFAULT_ELO,
    ua.ratedMatchesCount ?? 0,
    ub.elo ?? DEFAULT_ELO,
    ub.ratedMatchesCount ?? 0
  );

  return {
    A: { userId: ua.id, ...A },
    B: { userId: ub.id, ...B },
  };
}

/**
 * Convenience: Given a matchId (any status), compute previews for its two participants.
 * Uses current user ratings (not snapshots). No writes.
 */
export async function previewEloForMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: {
        select: { userId: true },
        orderBy: { userId: "asc" },
      },
    },
  });
  if (!match) throw new Error("Match not found");
  if (match.participants.length !== 2)
    throw new Error("Elo preview requires exactly 2 participants");

  const [pA, pB] = match.participants;
  return previewEloForUsers(pA.userId, pB.userId);
}
