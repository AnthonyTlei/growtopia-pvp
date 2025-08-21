import { prisma } from "./prisma";
import { Role } from "@prisma/client";
import { deleteMatch } from "./matches";

/**
 * Return all bans (newest first) with lightweight user/actor info.
 */
export async function getBans() {
  return prisma.ban.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, ign: true, name: true, image: true, email: true },
      },
      bannedBy: {
        select: {
          id: true,
          ign: true,
          name: true,
          image: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Permanently ban a user.
 *
 * Validations:
 * - Target user must exist.
 * - Actor must exist.
 * - User must not already be banned.
 *
 * Side-effects (intentional for a "perma ban"):
 * - Delete all reports created by the user.
 * - Delete all matches the user is involved in (as participant) or created.
 *   (Uses deleteMatch(), which also handles ELO reverts for rated/completed.)
 *
 * NOTE: Admin/owner authorization is expected to be enforced in the API layer.
 */
export async function banUser(args: {
  userId: string;
  bannedById: string;
  bannedByRole: Role;
  reason?: string;
}) {
  const { userId, bannedById, bannedByRole, reason } = args;

  const [targetUser, actor] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.user.findUnique({
      where: { id: bannedById },
      select: { id: true, role: true },
    }),
  ]);

  if (!targetUser) {
    throw new Error("User not found.");
  }
  if (!actor) {
    throw new Error("Actor not found.");
  }

  const existingBan = await prisma.ban.findUnique({ where: { userId } });
  if (existingBan) {
    throw new Error("User is already banned.");
  }

  const ban = await prisma.ban.create({
    data: {
      userId,
      bannedById,
      reason,
    },
    include: {
      user: {
        select: { id: true, ign: true, name: true, image: true, email: true },
      },
      bannedBy: {
        select: {
          id: true,
          ign: true,
          name: true,
          image: true,
          email: true,
          role: true,
        },
      },
    },
  });

  const [participantMatches, createdMatches] = await Promise.all([
    prisma.match.findMany({
      where: { participants: { some: { userId } } },
      select: { id: true },
    }),
    prisma.match.findMany({
      where: { createdById: userId },
      select: { id: true },
    }),
  ]);

  const matchIds = [
    ...new Set([
      ...participantMatches.map((m) => m.id),
      ...createdMatches.map((m) => m.id),
    ]),
  ];

  await prisma.report.deleteMany({
    where: { createdById: userId },
  });

  for (const id of matchIds) {
    try {
      await deleteMatch({ id, actorId: bannedById, actorRole: bannedByRole });
    } catch (err) {
      throw new Error(
        `Failed to delete match ${id} while banning user ${userId}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  return ban;
}

/**
 * Remove a user's ban (unban).
 *
 * Validations:
 * - Ban must exist for the user.
 */
export async function unBanUser(args: { userId: string }) {
  const { userId } = args;

  const existingBan = await prisma.ban.findUnique({ where: { userId } });
  if (!existingBan) {
    throw new Error("User is not banned.");
  }

  await prisma.ban.delete({ where: { userId } });
  return { userId };
}
