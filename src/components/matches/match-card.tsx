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
  hideActionButton?: boolean;
  className?: string;
}

export default function MatchCard({
  match,
  className,
  hideActionButton = false,
}: MatchCardProps) {
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

  const p1Before = isCompleted
    ? p1.eloBefore ?? DEFAULT_ELO
    : p1.user?.elo ?? DEFAULT_ELO;
  const p2Before = isCompleted
    ? p2.eloBefore ?? DEFAULT_ELO
    : p2.user?.elo ?? DEFAULT_ELO;

  const p1After = isCompleted ? p1.eloAfter ?? null : null;
  const p2After = isCompleted ? p2.eloAfter ?? null : null;

  const p1Delta = isCompleted ? p1.eloDelta ?? null : null;
  const p2Delta = isCompleted ? p2.eloDelta ?? null : null;

  const p1EloLive = p1.user?.elo ?? DEFAULT_ELO;
  const p2EloLive = p2.user?.elo ?? DEFAULT_ELO;
  const p1Count = p1.user?.ratedMatchesCount ?? 0;
  const p2Count = p2.user?.ratedMatchesCount ?? 0;

  const preview = isPreview
    ? previewEloOutcomesByNumbers(p1EloLive, p1Count, p2EloLive, p2Count)
    : null;

  const p1Preview = preview?.A ?? null;
  const p2Preview = preview?.B ?? null;

  return (
    <Card className={cn("rounded-2xl", className)}>
      <CardHeader className="py-2 sm:py-3">
        {" "}
        {/* ⬅ xs tighter */}
        {/* XS: two rows; SM+: single row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {statusBadge}
            {match.rated && (
              <Badge variant="secondary" className="uppercase">
                Rated
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs text-muted-foreground">
            <div className="flex items-center gap-1 sm:gap-2">
              {whenIcon}
              <span className="truncate">
                {whenLabel} {formatDate(when)}
              </span>
            </div>

            {/* Actions on far right even on XS */}
            {!hideActionButton && (
              <MatchActions
                matchId={match.id}
                createdById={match.createdById}
                status={match.status}
                initialMatch={match}
              />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-2 sm:py-3">
        {" "}
        {/* ⬅ xs tighter */}
        {/* Players + score */}
        <div className="grid grid-cols-3 sm:grid-cols-5 items-center gap-2 sm:gap-3">
          {" "}
          {/* ⬅ xs 3 cols */}
          {/* Player 1 */}
          <PlayerCell
            ign={p1.user?.ign}
            image={p1.user?.image}
            highlight={winner?.userId === p1.userId}
            align="left"
            size="xs" /* ⬅ smaller on mobile */
          />
          {/* Score */}
          <div className="col-span-1 sm:col-span-3">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <ScorePill
                value={p1.score}
                winner={winner?.userId === p1.userId}
              />
              <span className="text-xs sm:text-sm text-muted-foreground">
                —
              </span>
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
            size="xs" /* ⬅ smaller on mobile */
          />
        </div>
        {/* Elo rows */}
        {match.rated && (
          <>
            {/* SM+ grid (unchanged structure, but pass *before* / *delta* / *after*) */}
            <div className="mt-2 sm:mt-3 hidden sm:grid grid-cols-5 items-center text-xs">
              <div className="col-start-1 flex items-center gap-2">
                <EloBadge
                  current={p1Before}
                  delta={p1Delta}
                  after={p1After}
                  preview={
                    isPreview && p1Preview
                      ? { win: p1Preview.win, lose: p1Preview.lose }
                      : null
                  }
                  align="left"
                />
              </div>
              <div className="col-span-3" />
              <div className="col-start-5 flex items-center gap-2 justify-end">
                <EloBadge
                  current={p2Before}
                  delta={p2Delta}
                  after={p2After}
                  preview={
                    isPreview && p2Preview
                      ? { win: p2Preview.win, lose: p2Preview.lose }
                      : null
                  }
                  align="right"
                />
              </div>
            </div>

            {/* XS compact: use a 3-col grid so numbers align perfectly */}
            <div className="mt-2 sm:hidden space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="opacity-70">Elo</span>
                <EloBadge
                  compact
                  current={p1Before}
                  delta={p1Delta}
                  after={p1After}
                  preview={isPreview ? p1Preview : null}
                  align="right"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-0 select-none">Elo</span>
                <EloBadge
                  compact
                  current={p2Before}
                  delta={p2Delta}
                  after={p2After}
                  preview={isPreview ? p2Preview : null}
                  align="right"
                />
              </div>
            </div>
          </>
        )}
        {isCompleted && winner && (
          <>
            <Separator className="my-2 sm:my-3" />
            <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
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
  size = "md",
}: {
  ign?: string | null;
  image?: string | null;
  align?: "left" | "right";
  highlight?: boolean;
  size?: "xs" | "md";
}) {
  const initials = (ign ?? "?").slice(0, 2).toUpperCase();
  const avatarSize = size === "xs" ? "h-6 w-6" : "h-7 w-7";
  const nameCls = size === "xs" ? "text-[12px]" : "text-sm";

  return (
    <div
      className={cn(
        // default flex-col on xs, row on sm+
        "flex flex-col items-center text-center gap-0.5 sm:flex-row sm:gap-2",
        align === "right" && "sm:justify-end sm:text-right"
      )}
    >
      {/* Avatar (always shown above on xs, inline on sm+) */}
      <Avatar className={avatarSize}>
        <AvatarImage src={image ?? undefined} alt={ign ?? "player"} />
        <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
      </Avatar>

      {/* Name */}
      <div
        className={cn(
          nameCls,
          "truncate max-w-[5.5rem] sm:max-w-none",
          highlight ? "font-semibold" : "text-muted-foreground"
        )}
        title={ign ?? undefined}
      >
        {ign ?? "Unknown"}
      </div>
    </div>
  );
}

function ScorePill({ value, winner }: { value: number; winner?: boolean }) {
  return (
    <div
      className={cn(
        "min-w-9 sm:min-w-10 px-2.5 sm:px-3 py-1 rounded-full text-center text-[13px] sm:text-sm", // ⬅ xs tighter
        winner ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
      )}
    >
      {value}
    </div>
  );
}

// --- EloBadge
function EloBadge({
  current,
  delta,
  preview,
  after,
  align = "left",
  compact = false,
}: {
  current: number;
  delta: number | null;
  preview: { win: number; lose: number } | null;
  after: number | null;
  align?: "left" | "right";
  compact?: boolean;
}) {
  const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

  if (compact) {
    const isResult = after !== null && delta !== null;

    const cols = isResult
      ? "grid-cols-[4ch_min-content_min-content_4ch]"
      : "grid-cols-[4ch_min-content]";

    return (
      <div
        className={cn(
          "grid items-baseline tabular-nums gap-0.5 leading-none",
          cols,
          align === "right" ? "justify-items-end" : "justify-items-start"
        )}
      >
        {/* before */}
        <span className="font-medium">{current}</span>

        {/* delta or preview */}
        {isResult ? (
          <>
            <span
              className={cn(delta >= 0 ? "text-emerald-600" : "text-rose-600")}
            >
              {delta >= 0 ? `+${delta}` : `${delta}`}
            </span>
            <span className="text-muted-foreground pl-1">→</span>
          </>
        ) : preview ? (
          <span className="text-muted-foreground">
            {(preview.win >= 0 ? `+${preview.win}` : `${preview.win}`) +
              "/" +
              (preview.lose >= 0 ? `+${preview.lose}` : `${preview.lose}`)}
          </span>
        ) : isResult ? (
          <span />
        ) : null}

        {/* after (only for completed) */}
        {isResult ? <span className="font-medium">{after}</span> : null}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 sm:gap-2",
        align === "right" && "justify-end"
      )}
    >
      <span className="font-medium tabular-nums text-[13px] sm:text-sm">
        {current}
      </span>

      {after !== null && delta !== null ? (
        <>
          <span
            className={cn(
              "tabular-nums text-[13px] sm:text-sm",
              delta >= 0 ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {sign(delta)}
          </span>
          <span className="text-muted-foreground hidden sm:inline">→</span>
          <span className="font-medium tabular-nums text-[13px] sm:text-sm">
            {after}
          </span>
        </>
      ) : preview ? (
        <span className="tabular-nums text-[13px] sm:text-sm text-muted-foreground">
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
