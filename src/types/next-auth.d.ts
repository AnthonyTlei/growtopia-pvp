// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
      role: Role;
    };
  }
}
