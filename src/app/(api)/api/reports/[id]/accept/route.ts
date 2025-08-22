import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-utils";
import { acceptReport } from "@/lib/reports";

export async function POST(_req: Request, context: any) {
  const { params } = context as { params: { id: string } };

  const user = await getUser();
  if (!user || user.ban) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await acceptReport({
      reportId: params.id,
      actorId: user.id,
      actorRole: user.role,
    });
    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("POST /api/reports/[id]/accept failed:", error);
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
