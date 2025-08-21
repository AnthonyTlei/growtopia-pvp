import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      ign: true,
      acceptedTerms: true,
      elo: true,
      ratedMatchesCount: true,
      ban: {
        select: {
          id: true,
          userId: true,
          bannedById: true,
          createdAt: true,
          reason: true,
        },
      },
    },
  });

  return user;
}
