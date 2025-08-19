import { z } from "zod";

export const MatchStatusEnum = z.enum(["PENDING", "COMPLETED"]);

const participantSchema = z.object({
  userId: z.cuid("Invalid user id"),
  score: z.number().int().min(0, "Score cannot be negative"),
});

export const createMatchSchema = z
  .object({
    status: MatchStatusEnum,
    rated: z.boolean(),

    participants: z
      .array(participantSchema)
      .length(2, "A match must have exactly two players"),

    winnerId: z.cuid().optional(),
  })
  .superRefine((data, ctx) => {
    const { participants, status, winnerId } = data;

    const ids = participants.map((p) => p.userId);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["participants"],
        message: "Players must be distinct",
      });
    }

    if (status === "COMPLETED") {
      if (!winnerId) {
        ctx.addIssue({
          code: "custom",
          path: ["winnerId"],
          message: "Winner is required for a completed match",
        });
        return;
      }

      const p1 = participants[0];
      const p2 = participants[1];

      const winnerIsP1 = p1.userId === winnerId;
      const winnerIsP2 = p2.userId === winnerId;

      if (!winnerIsP1 && !winnerIsP2) {
        ctx.addIssue({
          code: "custom",
          path: ["winnerId"],
          message: "Winner must be one of the two players",
        });
      } else {
        if (winnerIsP1 && !(p1.score > p2.score)) {
          ctx.addIssue({
            code: "custom",
            path: ["participants", 0, "score"],
            message: "Winner must have a higher score than the opponent",
          });
        }
        if (winnerIsP2 && !(p2.score > p1.score)) {
          ctx.addIssue({
            code: "custom",
            path: ["participants", 1, "score"],
            message: "Winner must have a higher score than the opponent",
          });
        }
      }
    } else {
      if (winnerId) {
        ctx.addIssue({
          code: "custom",
          path: ["winnerId"],
          message: "Winner should only be set when the match is completed",
        });
      }
    }
  });

export type CreateMatchValues = z.infer<typeof createMatchSchema>;
