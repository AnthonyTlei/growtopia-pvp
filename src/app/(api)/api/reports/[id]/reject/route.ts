import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-utils";
import { rejectReport } from "@/lib/reports";

type RouteContext = { params: { id: string } };

export async function POST(_req: Request, { params }: RouteContext) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await rejectReport({
      reportId: params.id,
      actorRole: user.role,
      actorId: user.id,
    });
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error("POST /api/reports/[id]/reject failed:", error);
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
