"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MatchCard from "@/components/matches/match-card";
import type {
  MatchWithParticipants,
  ReportWithRelations,
} from "@/types/prisma-includes";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAcceptReport, useRejectReport } from "@/hooks/use-reports";
import { CheckCircle2, XCircle, Flag, Clock, User } from "lucide-react";

type Props = {
  report: ReportWithRelations;
  className?: string;
};

export default function ReportCard({ report, className }: Props) {
  const { data } = useCurrentUser();
  const user = data?.user;

  const isAdmin = user?.role === "ADMIN" || user?.role === "OWNER";

  const acceptMutation = useAcceptReport();
  const rejectMutation = useRejectReport();

  const isWorking = acceptMutation.isPending || rejectMutation.isPending;

  const match = report.match as MatchWithParticipants | undefined;

  return (
    <Card className={cn("rounded-2xl", className)}>
      <CardHeader className="py-3 space-y-2">
        {/* Top section: ID + status + date */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-amber-600 shrink-0" />
            <CardTitle className="text-base font-semibold truncate">
              Report #{shortId(report.id)}
            </CardTitle>
            <StatusBadge status={report.status} />
          </div>

          <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {formatDate(report.createdAt)}
          </CardDescription>
        </div>

        {/* Report Creator */}
        {report.createdBy && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
            <User className="h-4 w-4 shrink-0" />
            Reported by{" "}
            <span className="font-medium">{report.createdBy.ign}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Report message */}
        {report.message ? (
          <div className="rounded-md border p-3">
            <div className="text-xs font-medium mb-1">Message</div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {report.message}
            </p>
          </div>
        ) : (
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            No message provided.
          </div>
        )}

        {/* Reported match */}
        {match ? (
          <div className="rounded-md border overflow-hidden">
            <MatchCard match={match} hideActionButton />
          </div>
        ) : (
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            Match info unavailable.
          </div>
        )}
      </CardContent>

      {/* Admin actions */}
      {isAdmin && report.status === "PENDING" && (
        <CardFooter className="pt-2">
          <div className="flex flex-col sm:flex-row w-full gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => rejectMutation.mutate(report.id)}
              disabled={isWorking}
              className="w-full sm:w-auto"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {rejectMutation.isPending ? "Rejecting…" : "Reject"}
            </Button>
            <Button
              size="sm"
              onClick={() => acceptMutation.mutate(report.id)}
              disabled={isWorking}
              className="w-full sm:w-auto"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {acceptMutation.isPending ? "Accepting…" : "Accept"}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

/* ——— Helpers ——— */

function StatusBadge({ status }: { status: ReportWithRelations["status"] }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge
          variant="outline"
          className="border-yellow-500/40 text-yellow-700"
        >
          Pending
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
          Completed
        </Badge>
      );
    case "CLOSED":
      return <Badge variant="secondary">Closed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function shortId(id?: string | null) {
  if (!id) return "—";
  return id.length > 8 ? `${id.slice(0, 4)}…${id.slice(-3)}` : id;
}

function formatDate(d?: string | Date | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}
