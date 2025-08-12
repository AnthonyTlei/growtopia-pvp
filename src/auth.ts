import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/prisma";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { Role } from "@prisma/client";

const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
