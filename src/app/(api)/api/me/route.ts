import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-utils";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });

  return NextResponse.json({
    user: { id: user.id, role: user.role },
  });
}
