import { Prisma } from "@prisma/client";

export const matchesWithParticipants = {
  participants: {
    include: {
      user: {
        select: {
          id: true,
          ign: true,
          image: true,
          elo: true,
          ratedMatchesCount: true,
        },
      },
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      ign: true,
      image: true,
    },
  },
} satisfies Prisma.MatchInclude;

export type MatchWithParticipants = Prisma.MatchGetPayload<{
  include: typeof matchesWithParticipants;
}>;

export const reportsWithRelations = {
  match: {
    include: matchesWithParticipants,
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      ign: true,
      image: true,
    },
  },
} satisfies Prisma.ReportInclude;

export type ReportWithRelations = Prisma.ReportGetPayload<{
  include: typeof reportsWithRelations;
}>;
