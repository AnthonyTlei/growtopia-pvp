import { getMatches } from "@/lib/matches";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const matches = await getMatches();
    return NextResponse.json(matches);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : 500;
    console.error("GET /matches error:", error);
    return NextResponse.json({ message }, { status });
  }
}
