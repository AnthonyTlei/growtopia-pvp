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
