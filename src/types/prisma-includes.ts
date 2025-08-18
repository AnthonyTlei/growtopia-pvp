import { Prisma } from "@prisma/client";

export const matchesWithParticipants = {
  participants: {
    include: {
      user: {
        select: {
          id: true,
          ign: true,
          image: true,
        },
      },
    },
  },
} satisfies Prisma.MatchInclude;

// Types
export type MatchWithParticipants = Prisma.MatchGetPayload<{
  include: typeof matchesWithParticipants;
}>;
