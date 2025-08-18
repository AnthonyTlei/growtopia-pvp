import { getPlayers } from "@/lib/players";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const players = await getPlayers();
    return NextResponse.json(players);
  } catch (error: unknown) {
    console.error("GET /players error:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
