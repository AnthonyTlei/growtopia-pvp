import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-utils";
import { banUser, getBans, unBanUser } from "@/lib/ban";
import { Role } from "@prisma/client";

/** Guard: only ADMIN or OWNER */
function ensureAdmin(role: Role) {
  if (role !== "ADMIN" && role !== "OWNER") {
    throw new Error("Forbidden: admin access required.");
  }
}

/** GET /api/ban — list all bans (admin only) */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    ensureAdmin(user.role);
    const bans = await getBans();
    return NextResponse.json(bans, { status: 200 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    const code = msg.includes("Forbidden") ? 403 : 500;
    console.error("GET /api/ban failed:", error);
    return NextResponse.json({ message: msg }, { status: code });
  }
}

/** POST /api/ban — ban a user (admin only)
 * Body: { userId: string, reason?: string }
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    ensureAdmin(user.role);
    const body = await req.json().catch(() => ({}));
    const { userId, reason } = body as { userId?: string; reason?: string };

    if (!userId) {
      return NextResponse.json(
        { message: "Missing required field: userId" },
        { status: 400 }
      );
    }

    const ban = await banUser({
      userId,
      bannedById: user.id,
      bannedByRole: user.role,
      reason,
    });

    return NextResponse.json(ban, { status: 201 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    const code = msg.includes("Forbidden") ? 403 : 400;
    console.error("POST /api/ban failed:", error);
    return NextResponse.json({ message: msg }, { status: code });
  }
}

/** DELETE /api/ban — unban a user (admin only)
 * Accepts userId either in JSON body { userId } or as query string ?userId=...
 */
export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    ensureAdmin(user.role);

    let userId: string | undefined;

    try {
      const body = await req.json();
      if (body && typeof body.userId === "string") userId = body.userId;
    } catch {}

    if (!userId) {
      const url = new URL(req.url);
      const q = url.searchParams.get("userId");
      if (q) userId = q;
    }

    if (!userId) {
      return NextResponse.json(
        { message: "Missing required field: userId" },
        { status: 400 }
      );
    }

    const res = await unBanUser({ userId });
    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    const code = msg.includes("Forbidden") ? 403 : 400;
    console.error("DELETE /api/ban failed:", error);
    return NextResponse.json({ message: msg }, { status: code });
  }
}
