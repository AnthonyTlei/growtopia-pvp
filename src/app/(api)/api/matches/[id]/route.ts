import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getUser } from "@/lib/auth-utils";
import { createMatchSchema, type CreateMatchValues } from "@/lib/validation";
import { updateMatch } from "@/lib/matches";

type RouteContext = { params: { id: string } };

export async function PATCH(req: Request, { params }: RouteContext) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await req.json();
    const values = createMatchSchema.parse(raw) as CreateMatchValues;

    const updated = await updateMatch({
      id: params.id,
      values,
      actorId: user.id,
      actorRole: user.role,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/matches/[id] failed:", error);

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
