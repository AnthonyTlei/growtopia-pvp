import { getUser } from "@/lib/auth-utils";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { createMatch } from "@/lib/matches";
import { createMatchSchema } from "@/lib/validation";

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

    const match = await createMatch(values);
    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("POST /api/matches/create failed:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
