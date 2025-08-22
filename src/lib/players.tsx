import { MatchStatus } from "@prisma/client";
import { prisma } from "./prisma";

export async function getPlayers() {
  try {
    const players = await prisma.user.findMany({
      select: {
        id: true,
        ign: true,
        image: true,
        ban: true,
      },
    });
    return players;
  } catch (err) {
    console.error("Failed to fetch players:", err);
    throw new Error("Could not fetch players. Please try again later.");
  }
}

type PlayerRanking = {
  id: string;
  ign: string | null;
  image: string | null;
  elo: number;
  latestMatch: {
    id: string;
    status: MatchStatus;
    rated: boolean;
    createdAt: Date;
    completedAt: Date | null;
    participant: {
      score: number;
      eloBefore: number | null;
      eloAfter: number | null;
      eloDelta: number | null;
    };
  } | null;
};

/**
 * Returns all players (excluding banned), sorted by elo DESC,
 * with their most recent match participation (if any).
 */
export async function getPlayersRankings(): Promise<PlayerRanking[]> {
  try {
    const players = await prisma.user.findMany({
      where: { ban: null },
      orderBy: { elo: "desc" },
      select: {
        id: true,
        ign: true,
        image: true,
        elo: true,
        matches: {
          where: { match: { status: "COMPLETED" } },
          take: 1,
          orderBy: { match: { createdAt: "desc" } },
          select: {
            score: true,
            eloBefore: true,
            eloAfter: true,
            eloDelta: true,
            match: {
              select: {
                id: true,
                status: true,
                rated: true,
                createdAt: true,
                completedAt: true,
              },
            },
          },
        },
      },
    });

    return players.map((p) => {
      const mp = p.matches[0];
      const latestMatch = mp?.match
        ? {
            id: mp.match.id,
            status: mp.match.status,
            rated: mp.match.rated,
            createdAt: mp.match.createdAt,
            completedAt: mp.match.completedAt,
            participant: {
              score: mp.score,
              eloBefore: mp.eloBefore,
              eloAfter: mp.eloAfter,
              eloDelta: mp.eloDelta,
            },
          }
        : null;

      return {
        id: p.id,
        ign: p.ign,
        image: p.image,
        elo: p.elo,
        latestMatch,
      };
    });
  } catch (err) {
    console.error("Failed to fetch players:", err);
    throw new Error("Could not fetch players. Please try again later.");
  }
}
