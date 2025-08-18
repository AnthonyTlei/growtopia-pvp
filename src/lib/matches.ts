import { matchesWithParticipants } from "@/types/prisma-includes";
import { prisma } from "./prisma";
import { CreateMatchValues } from "./validation";

export async function getMatches() {
  try {
    const matches = await prisma.match.findMany({
      include: matchesWithParticipants,
    });
    return matches;
  } catch (err) {
    console.error("Failed to fetch matches:", err);
    throw new Error("Could not fetch matches. Please try again later.");
  }
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
