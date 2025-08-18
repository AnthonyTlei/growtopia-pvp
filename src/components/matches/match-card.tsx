"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { MatchWithParticipants } from "@/types/prisma-includes";
import { MatchStatus } from "@prisma/client";
import { CheckCircle2, Clock3, Timer } from "lucide-react";

interface MatchCardProps {
  match: MatchWithParticipants;
  className?: string;
}

export default function MatchCard({ match, className }: MatchCardProps) {
  const participants = match.participants ?? [];

  if (participants.length !== 2) {
    return (
      <Card className={cn("rounded-2xl", className)}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <Badge variant="destructive" className="uppercase">
              Invalid
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Expected 2 participants, got {participants.length || 0}.
        </CardContent>
      </Card>
    );
  }

  const [p1, p2] = participants;

  // Winner/loser resolution
  const winner =
    (match.winnerId && participants.find((p) => p.userId === match.winnerId)) ||
    // Fallback: higher score (in case winnerId missing but completed)
    (p1.score === p2.score ? undefined : p1.score > p2.score ? p1 : p2);

  const loser =
    (winner && participants.find((p) => p.userId !== winner.userId)) ||
    undefined;

  const statusBadge = <StatusBadge status={match.status} />;

  const when =
    match.status === MatchStatus.COMPLETED
      ? match.completedAt ?? match.createdAt
      : match.createdAt;

  const whenLabel =
    match.status === MatchStatus.COMPLETED ? "Completed" : "Created";

  const whenIcon =
    match.status === MatchStatus.COMPLETED ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : match.status === MatchStatus.IN_PROGRESS ? (
      <Timer className="h-4 w-4" />
    ) : (
      <Clock3 className="h-4 w-4" />
    );

  return (
    <Card className={cn("rounded-2xl", className)}>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {statusBadge}
            {match.rated && (
              <Badge variant="secondary" className="uppercase">
                Rated
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {whenIcon}
            <span>
              {whenLabel} {formatDate(when)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-3">
        <div className="grid grid-cols-5 items-center gap-3">
          {/* Player 1 */}
          <PlayerCell
            ign={p1.user?.ign}
            image={p1.user?.image}
            highlight={winner?.userId === p1.userId}
            align="left"
          />

          {/* Score */}
          <div className="col-span-3">
            <div className="flex items-center justify-center gap-2">
              <ScorePill
                value={p1.score}
                winner={winner?.userId === p1.userId}
              />
              <span className="text-sm text-muted-foreground">—</span>
              <ScorePill
                value={p2.score}
                winner={winner?.userId === p2.userId}
              />
            </div>
          </div>

          {/* Player 2 */}
          <PlayerCell
            ign={p2.user?.ign}
            image={p2.user?.image}
            highlight={winner?.userId === p2.userId}
            align="right"
          />
        </div>

        {match.status === MatchStatus.COMPLETED && winner && loser && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Winner:</span>
              <span className="font-medium text-foreground">
                {winner.user?.ign ?? shortId(winner.userId)}
              </span>
            </div>
          </>
        )}
      </CardContent>

      {/* Optional footer: show IDs or extra meta */}
      {/* <CardFooter className="py-3 text-xs text-muted-foreground">
        <div className="w-full flex items-center justify-between">
          <span>Match ID: {match.id}</span>
        </div>
      </CardFooter> */}
    </Card>
  );
}

/** ————— Helpers ————— */

function StatusBadge({ status }: { status: MatchStatus }) {
  switch (status) {
    case MatchStatus.PENDING:
      return (
        <Badge
          variant="outline"
          className="uppercase border-yellow-500/40 text-yellow-600"
        >
          Pending
        </Badge>
      );
    case MatchStatus.IN_PROGRESS:
      return (
        <Badge className="uppercase bg-blue-600 text-white hover:bg-blue-600">
          In Progress
        </Badge>
      );
    case MatchStatus.COMPLETED:
      return (
        <Badge className="uppercase bg-emerald-600 text-white hover:bg-emerald-600">
          Completed
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="uppercase">
          {status}
        </Badge>
      );
  }
}

function PlayerCell({
  ign,
  image,
  align = "left",
  highlight,
}: {
  ign?: string | null;
  image?: string | null;
  align?: "left" | "right";
  highlight?: boolean;
}) {
  const initials = (ign ?? "?").slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        align === "right" && "justify-end text-right"
      )}
    >
      {align === "left" && (
        <Avatar className="h-7 w-7">
          <AvatarImage src={image ?? undefined} alt={ign ?? "player"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "text-sm",
          highlight ? "font-semibold" : "text-muted-foreground"
        )}
      >
        {ign ?? "Unknown"}
      </div>

      {align === "right" && (
        <Avatar className="h-7 w-7">
          <AvatarImage src={image ?? undefined} alt={ign ?? "player"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function ScorePill({ value, winner }: { value: number; winner?: boolean }) {
  return (
    <div
      className={cn(
        "min-w-10 px-3 py-1 rounded-full text-center text-sm",
        winner ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
      )}
    >
      {value}
    </div>
  );
}

function formatDate(d?: Date | string | null) {
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

function shortId(id?: string | null) {
  if (!id) return "—";
  return id.length > 8 ? `${id.slice(0, 4)}…${id.slice(-3)}` : id;
}
