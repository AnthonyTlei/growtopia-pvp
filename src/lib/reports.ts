import { prisma } from "@/lib/prisma";
import { Prisma, ReportStatus, Role } from "@prisma/client";
import { deleteMatch } from "@/lib/matches";

/** ---------- Types ---------- */
export type CreateReportArgs = {
  actorId: string;
  matchId: string;
  message?: string | null;
};

export type RejectReportArgs = {
  reportId: string;
  actorId: string;
  actorRole: Role;
};

export type AcceptReportArgs = {
  reportId: string;
  actorId: string;
  actorRole: Role;
};

export type ReportWithRelations = Awaited<
  ReturnType<typeof listReportsForUser>
>[number];

/** ---------- Helpers ---------- */
function assertAdminOrOwner(role: Role) {
  if (!(role === Role.ADMIN || role === Role.OWNER)) {
    throw new Error("Forbidden: admin privileges required.");
  }
}

/**
 * List reports visible to the given actor:
 * - ADMIN/OWNER: all reports
 * - USER: only their own reports
 */
export async function listReportsForUser(actor: { id: string; role: Role }) {
  const where =
    actor.role === "ADMIN" || actor.role === "OWNER"
      ? {}
      : { createdById: actor.id };

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      match: true,
      createdBy: true,
    },
  });

  return reports;
}

/**
 * Create a report for a match.
 * - Validates match exists
 * - Prevents duplicates for the same (matchId, createdById) via unique constraint
 * - Increments Match.reportsCount atomically
 */
export async function createReport({
  actorId,
  matchId,
  message,
}: CreateReportArgs) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Ensure the match exists
      const match = await tx.match.findUnique({
        where: { id: matchId },
        select: { id: true },
      });
      if (!match) throw new Error("Match not found.");

      const report = await tx.report.create({
        data: {
          createdById: actorId,
          matchId,
          message: message ?? null,
          status: ReportStatus.PENDING,
        },
      });

      await tx.match.update({
        where: { id: matchId },
        data: { reportsCount: { increment: 1 } },
      });

      return report;
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new Error("You have already reported this match.");
    }
    console.error("createReport failed:", err);
    throw err instanceof Error ? err : new Error("Failed to create report.");
  }
}

/**
 * Reject (close) a report without deleting the match.
 * - ADMIN/OWNER only
 * - Idempotent: if already CLOSED, it stays closed; if COMPLETED, throws by default
 */
export async function rejectReport({ reportId, actorRole }: RejectReportArgs) {
  assertAdminOrOwner(actorRole);

  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, status: true },
    });
    if (!report) throw new Error("Report not found.");

    if (report.status === ReportStatus.COMPLETED) {
      throw new Error("Cannot reject a completed report.");
    }
    if (report.status === ReportStatus.CLOSED) {
      return await prisma.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.CLOSED },
      });
    }

    return await prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.CLOSED },
    });
  } catch (err) {
    console.error("rejectReport failed:", err);
    throw err instanceof Error ? err : new Error("Failed to reject report.");
  }
}

/**
 * Accept a report:
 * - ADMIN/OWNER only
 * - Mark the report as COMPLETED
 * - Delete the match via lib/matches.deleteMatch (handles ELO reverts as you designed)
 * - Delete all Reports on the match
 * Returns the accepted report id and the deleted match id.
 */
export async function acceptReport({
  reportId,
  actorId,
  actorRole,
}: AcceptReportArgs): Promise<{ reportId: string; deletedMatchId: string }> {
  assertAdminOrOwner(actorRole);

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, status: true, matchId: true },
  });
  if (!report) throw new Error("Report not found.");

  if (report.status === ReportStatus.COMPLETED) {
    return { reportId: report.id, deletedMatchId: report.matchId };
  }

  await prisma.report.update({
    where: { id: reportId },
    data: { status: ReportStatus.COMPLETED },
  });

  const { id: deletedMatchId } = await deleteMatch({
    id: report.matchId,
    actorId,
    actorRole,
  });

  return { reportId: report.id, deletedMatchId };
}
