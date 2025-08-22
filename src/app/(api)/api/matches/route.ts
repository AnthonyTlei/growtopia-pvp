import { getMatchesInfinite } from "@/lib/matches";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const cursorId = url.searchParams.get("cursorId") ?? undefined;
    const limitParam = url.searchParams.get("limit");
    const orderParam = url.searchParams.get("order");
    const limit = Math.max(1, Math.min(Number(limitParam ?? 20) || 20, 100));
    const order = orderParam === "asc" ? "asc" : "desc";

    const data = await getMatchesInfinite({ cursorId, limit, order });

     console.log("Matches returned from DB:", data);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("GET /matches error:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
