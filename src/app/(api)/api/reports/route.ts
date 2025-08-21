import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-utils";
import { createReport, listReportsForUser } from "@/lib/reports";
import { createReportSchema } from "@/lib/validation";
import { ZodError } from "zod";

export async function GET() {
  const user = await getUser();
  if (!user || user.ban) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const reports = await listReportsForUser({ id: user.id, role: user.role });
    return NextResponse.json(reports, { status: 200 });
  } catch (error) {
    console.error("GET /api/reports failed:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user || user.ban) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await req.json();
    const values = createReportSchema.parse(raw);

    const report = await createReport({
      matchId: values.matchId,
      actorId: user.id,
      message: values.message,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("POST /api/reports failed:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Invalid request", issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
