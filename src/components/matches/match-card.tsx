"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { MatchWithParticipants } from "@/types/prisma-includes";
import { MatchStatus } from "@prisma/client";
import { Clock3, Timer } from "lucide-react";
import { previewEloOutcomesByNumbers, DEFAULT_ELO } from "@/lib/elo";
import MatchActions from "./match-actions";

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

  // Winner/loser
  const winner =
    (match.winnerId && participants.find((p) => p.userId === match.winnerId)) ||
    (p1.score === p2.score ? undefined : p1.score > p2.score ? p1 : p2);
  const statusBadge = <StatusBadge status={match.status} />;

  const when =
    match.status === MatchStatus.COMPLETED
      ? match.completedAt ?? match.createdAt
      : match.createdAt;
  const whenLabel =
    match.status === MatchStatus.COMPLETED ? "Completed" : "Created";
  const whenIcon =
    match.status === MatchStatus.COMPLETED ? (
      <Timer className="h-4 w-4" />
    ) : (
      <Clock3 className="h-4 w-4" />
    );

  const isCompleted = match.status === MatchStatus.COMPLETED;
  const isPreview = match.rated && !isCompleted;

  const p1Elo = p1.user?.elo ?? DEFAULT_ELO;
  const p2Elo = p2.user?.elo ?? DEFAULT_ELO;
  const p1Count = p1.user?.ratedMatchesCount ?? 0;
  const p2Count = p2.user?.ratedMatchesCount ?? 0;

  const preview = isPreview
    ? previewEloOutcomesByNumbers(p1Elo, p1Count, p2Elo, p2Count)
    : null;

  const p1Preview = preview?.A;
  const p2Preview = preview?.B;

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

            {/* Actions menu */}
            <MatchActions
              matchId={match.id}
              createdById={match.createdById}
              status={match.status}
              initialMatch={match}
            />
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

        {/* Elo rows */}
        {match.rated && (
          <div className="mt-3 grid grid-cols-5 items-center text-xs">
            {/* P1 ELO display */}
            <div className="col-start-1 flex items-center gap-2">
              <EloBadge
                current={p1Elo}
                delta={isCompleted ? p1.eloDelta ?? null : null}
                preview={
                  isPreview && p1Preview
                    ? { win: p1Preview.win, lose: p1Preview.lose }
                    : null
                }
                after={isCompleted ? p1.eloAfter ?? null : null}
                align="left"
              />
            </div>

            <div className="col-span-3" />

            {/* P2 ELO display */}
            <div className="col-start-5 flex items-center gap-2 justify-end">
              <EloBadge
                current={p2Elo}
                delta={isCompleted ? p2.eloDelta ?? null : null}
                preview={
                  isPreview && p2Preview
                    ? { win: p2Preview.win, lose: p2Preview.lose }
                    : null
                }
                after={isCompleted ? p2.eloAfter ?? null : null}
                align="right"
              />
            </div>
          </div>
        )}

        {isCompleted && winner && (
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

function EloBadge({
  current,
  delta,
  preview,
  after,
  align = "left",
}: {
  current: number;
  delta: number | null;
  preview: { win: number; lose: number } | null;
  after: number | null;
  align?: "left" | "right";
}) {
  const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        align === "right" && "justify-end"
      )}
    >
      {/* current elo */}
      <span className="font-medium tabular-nums">{current}</span>

      {/* completed: show actual delta and new elo */}
      {after !== null && delta !== null ? (
        <>
          <span
            className={cn(
              "tabular-nums",
              delta >= 0 ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {sign(delta)}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium tabular-nums">{after}</span>
        </>
      ) : preview ? (
        <span className="tabular-nums text-muted-foreground">
          {sign(preview.win)} / {preview.lose}
        </span>
      ) : null}
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
