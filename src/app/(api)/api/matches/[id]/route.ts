import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getUser } from "@/lib/auth-utils";
import { createMatchSchema, type CreateMatchValues } from "@/lib/validation";
import { updateMatch, deleteMatch } from "@/lib/matches";

export async function PATCH(req: Request, ctx: any) {
  const user = await getUser();
  if (!user || user.ban) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const id = ctx?.params?.id as string | undefined;
  if (!id) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  try {
    const raw = await req.json();
    const values = createMatchSchema.parse(raw) as CreateMatchValues;

    const updated = await updateMatch({
      id,
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

export async function DELETE(_req: Request, ctx: any) {
  const user = await getUser();
  if (!user || user.ban) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const id = ctx?.params?.id as string | undefined;
  if (!id) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  try {
    const result = await deleteMatch({
      id,
      actorId: user.id,
      actorRole: user.role,
    });

    return NextResponse.json({ id: result.id }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/matches/[id] failed:", error);
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
