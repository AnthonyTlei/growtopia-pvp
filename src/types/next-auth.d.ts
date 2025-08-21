import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    ign?: string;
    acceptedTerms: boolean;
    elo: number;
    ratedMatchesCount: number;

    ban?: {
      id: string;
      userId: string;
      bannedById: string;
      createdAt: Date;
      reason: string | null;
    } | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
      role: Role;
      ign?: string;
      acceptedTerms: boolean;
      elo: number;
      ratedMatchesCount: number;

      ban?: {
        id: string;
        userId: string;
        bannedById: string;
        createdAt: Date;
        reason: string | null;
      } | null;
    };
  }
}
