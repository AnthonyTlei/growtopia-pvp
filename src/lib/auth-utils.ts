import { auth } from "@/auth";
import { Role } from "@prisma/client";

export async function getUser() {
  const session = await auth();
  const user = session?.user;
  return user;
}
