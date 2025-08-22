import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch top 3 users by Elo
    const topPlayers = await prisma.user.findMany({
      orderBy: { elo: "desc" },
      take: 3,
      select: {
        id: true,
        ign: true,
        image: true,
        elo: true,
        matches: {
          take: 1, // latest match participant row for this user
          orderBy: { match: { createdAt: "desc" } },
          select: {
            match: {
              select: {
                id: true,
                status: true,
                rated: true,
                createdAt: true,
                completedAt: true,
              },
            },
            score: true,
            eloBefore: true,
            eloAfter: true,
            eloDelta: true,
          },
        },
      },
    });

    const players = topPlayers.map((user) => {
      const mp = user.matches[0]; // latest MatchParticipant
      return {
        id: user.id,
        ign: user.ign,
        image: user.image,
        elo: user.elo,
        latestMatch: mp
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
          : null,
      };
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch top players" }, { status: 500 });
  }
}
