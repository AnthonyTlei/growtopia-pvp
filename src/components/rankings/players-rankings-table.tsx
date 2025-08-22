"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";

export type PlayerRanking = {
  id: string;
  ign: string | null;
  image: string | null;
  elo: number;
  latestMatch: {
    id: string;
    status: "PENDING" | "COMPLETED";
    rated: boolean;
    createdAt: Date;
    completedAt: Date | null;
    participant: {
      score: number;
      eloBefore: number | null;
      eloAfter: number | null;
      eloDelta: number | null;
    };
  } | null;
};

type Props = {
  players: PlayerRanking[];
  className?: string;
};

type SortKey = "elo" | "ign" | "lastPlayed";
type SortDir = "desc" | "asc";

export default function PlayersRankingsTable({ players, className }: Props) {
  const [q, setQ] = React.useState("");
  const [hasMatchOnly, setHasMatchOnly] = React.useState(false);
  const [sortKey, setSortKey] = React.useState<SortKey>("elo");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const filtered = React.useMemo(() => {
    const qNorm = q.trim().toLowerCase();
    let rows = players.filter((p) => {
      if (hasMatchOnly && !p.latestMatch) return false;
      if (!qNorm) return true;
      return (
        (p.ign ?? "").toLowerCase().includes(qNorm) || p.id.includes(qNorm)
      );
    });

    rows.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "elo":
          return (a.elo - b.elo) * dir;
        case "ign":
          return normalizeIgn(a.ign).localeCompare(normalizeIgn(b.ign)) * dir;
        case "lastPlayed": {
          const aTime = a.latestMatch?.createdAt
            ? new Date(a.latestMatch.createdAt).getTime()
            : 0;
          const bTime = b.latestMatch?.createdAt
            ? new Date(b.latestMatch.createdAt).getTime()
            : 0;
          return (aTime - bTime) * dir;
        }
        default:
          return 0;
      }
    });

    return rows;
  }, [players, q, hasMatchOnly, sortKey, sortDir]);

  function toggleSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(nextKey);
      // sensible defaults
      setSortDir(nextKey === "ign" ? "asc" : "desc");
    }
  }

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search player IGN or ID…"
              className="w-[260px] max-w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="hasMatch" className="text-sm text-muted-foreground">
              Has recent match
            </Label>
            <Switch
              id="hasMatch"
              checked={hasMatchOnly}
              onCheckedChange={setHasMatchOnly}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={`${sortKey}:${sortDir}`}
            onValueChange={(val) => {
              const [k, d] = val.split(":") as [SortKey, SortDir];
              setSortKey(k);
              setSortDir(d);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elo:desc">Elo (high → low)</SelectItem>
              <SelectItem value="elo:asc">Elo (low → high)</SelectItem>
              <SelectItem value="ign:asc">IGN (A → Z)</SelectItem>
              <SelectItem value="ign:desc">IGN (Z → A)</SelectItem>
              <SelectItem value="lastPlayed:desc">
                Last played (new → old)
              </SelectItem>
              <SelectItem value="lastPlayed:asc">
                Last played (old → new)
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleSort(sortKey)}
            title="Toggle sort direction"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="w-full rounded-md border">
        <div className="min-w-[720px]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead className="w-14 text-center">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">
                  <button
                    className="inline-flex items-center gap-1 font-medium hover:opacity-80"
                    onClick={() => toggleSort("elo")}
                  >
                    Elo
                  </button>
                </TableHead>
                <TableHead className="text-right">Δ Last</TableHead>
                <TableHead className="text-right">Last played</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p, idx) => {
                const rank = idx + 1;
                const ign = p.ign ?? "Unknown";
                const initials = (ign || "??").slice(0, 2).toUpperCase();

                const lm = p.latestMatch;
                const delta = lm?.participant.eloDelta ?? null;
                const rated = lm?.rated ?? false;

                return (
                  <TableRow key={p.id} className="hover:bg-muted/40">
                    <TableCell className="text-center font-medium tabular-nums">
                      {rank}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={p.image ?? undefined} alt={ign} />
                          <AvatarFallback className="text-[11px]">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{ign}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {shortId(p.id)}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-semibold tabular-nums">
                      {p.elo}
                    </TableCell>

                    <TableCell className="text-right">
                      {delta === null ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : delta >= 0 ? (
                        <div className="inline-flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                          <span className="tabular-nums text-emerald-600">
                            +{delta}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <TrendingDown className="h-4 w-4 text-rose-600" />
                          <span className="tabular-nums text-rose-600">
                            {delta}
                          </span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-right text-sm text-muted-foreground">
                      {lm?.createdAt ? formatDate(lm.createdAt) : "—"}
                    </TableCell>

                    <TableCell className="text-right">
                      {lm ? (
                        <Badge
                          variant={rated ? "default" : "secondary"}
                          className="uppercase"
                        >
                          {rated ? "Rated" : "Unrated"}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="uppercase text-muted-foreground"
                        >
                          No Matches
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Footer summary */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Total players: {filtered.length}</span>
        <span>
          Sorted by{" "}
          <strong className="text-foreground">
            {labelForSort(sortKey, sortDir)}
          </strong>
        </span>
      </div>
    </div>
  );
}

/* ——— helpers ——— */

function normalizeIgn(ign: string | null) {
  return (ign ?? "").trim().toLowerCase();
}

function shortId(id: string) {
  return id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-3)}` : id;
}

function formatDate(d: Date | string) {
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

function labelForSort(k: "elo" | "ign" | "lastPlayed", d: "asc" | "desc") {
  const dir = d === "asc" ? "↑" : "↓";
  if (k === "elo") return `Elo ${dir}`;
  if (k === "ign") return `IGN ${dir}`;
  return `Last played ${dir}`;
}
