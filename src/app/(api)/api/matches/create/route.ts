import { getUser } from "@/lib/auth-utils";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { createMatch } from "@/lib/matches";
import { createMatchSchema } from "@/lib/validation";
import { ZodError } from "zod";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await req.json();
    const values = createMatchSchema.parse(raw);

    if (user.role === Role.USER) {
      const participantIds = values.participants.map((p) => p.userId);
      if (!participantIds.includes(user.id)) {
        return NextResponse.json(
          { message: "Users can only create matches they participate in" },
          { status: 403 }
        );
      }
    }

    const match = await createMatch(values, user.id);
    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("POST /api/matches/create failed:", error);

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
