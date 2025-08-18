"use server";

import { auth } from "@/auth";
import { prisma } from "./prisma";

export async function acceptTermsAndConditions() {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;

  if (!user?.id) {
    throw new Error("Not authenticated");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { acceptedTerms: true },
  });

  return updated;
}

export async function setInGameName(name: string) {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;

  if (!user?.id) {
    throw new Error("Not authenticated");
  }

  const existing = await prisma.user.findFirst({
    where: { ign: name },
  });

  if (existing) {
    throw new Error("In-game name already taken");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { ign: name },
  });

  return updated;
}
