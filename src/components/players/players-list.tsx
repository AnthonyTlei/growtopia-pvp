"use client";

import * as React from "react";
import kyInstance from "@/lib/ky";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldBan,
  ShieldCheck,
  User2,
  CalendarClock,
  Ban as BanIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HTTPError } from "ky";

type BanInfo = {
  id: string;
  userId: string;
  createdAt: Date | string;
  bannedById: string;
  reason: string | null;
} | null;

export type PlayerItem = {
  id: string;
  image: string | null;
  ign: string | null;
  ban: BanInfo;
};

type PlayersListProps = {
  players: PlayerItem[];
  className?: string;
};

/** --- tiny error normalizer like we used elsewhere --- */
export async function normalizeHttpError(err: unknown): Promise<Error> {
  if (err && err instanceof Error && "response" in err) {
    const httpErr = err as HTTPError;
    const res = httpErr.response;
    try {
      let message = `${res.status} ${res.statusText}`;
      try {
        const data = (await res.clone().json()) as { message?: string };
        if (data?.message) message = data.message;
      } catch {
        try {
          const txt = await res.text();
          if (txt) message = txt;
        } catch {}
      }

      return new Error(message);
    } catch {
      return new Error("Request failed");
    }
  }

  return err instanceof Error ? err : new Error("Request failed");
}

/** --- Dialog to confirm ban/unban --- */
function BanPlayerDialog({
  open,
  mode,
  player,
  onClose,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  mode: "ban" | "unban";
  player?: PlayerItem | null;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  isLoading?: boolean;
}) {
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const title = mode === "ban" ? "Ban player" : "Unban player";
  const desc =
    mode === "ban"
      ? "This will permanently ban this player. All of their matches and reports will be removed."
      : "This will remove the ban and allow the player to use the platform again.";

  return (
    <Dialog open={open} onOpenChange={(o) => !isLoading && !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "ban" ? (
              <ShieldBan className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User2 className="h-4 w-4" />
            <span className="truncate">
              {player?.ign ?? "Unknown"}{" "}
              <span className="opacity-60">({player?.id})</span>
            </span>
          </div>

          {mode === "ban" && (
            <div className="grid gap-2">
              <Label htmlFor="ban-reason">Reason (optional)</Label>
              <Textarea
                id="ban-reason"
                placeholder="Brief reason for the ban (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isLoading}
                className="min-h-24 text-sm"
                maxLength={2000}
              />
              <div className="text-xs text-muted-foreground text-right">
                {reason.length}/2000
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={mode === "ban" ? "destructive" : "default"}
            onClick={() => onConfirm(reason || undefined)}
            disabled={isLoading}
          >
            {isLoading
              ? mode === "ban"
                ? "Banning..."
                : "Unbanning..."
              : mode === "ban"
              ? "Ban Player"
              : "Unban Player"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** --- One card per player --- */
function PlayerCard({
  player,
  isAdmin,
  onBanClick,
  onUnbanClick,
  loading,
}: {
  player: PlayerItem;
  isAdmin: boolean;
  onBanClick: (p: PlayerItem) => void;
  onUnbanClick: (p: PlayerItem) => void;
  loading?: boolean;
}) {
  const initials = (player.ign ?? "??").slice(0, 2).toUpperCase();
  const banned = !!player.ban;

  return (
    <Card className={cn("rounded-xl overflow-hidden")}>
      <CardHeader className="py-3 px-3 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 sm:h-11 sm:w-11">
              <AvatarImage
                src={player.image ?? undefined}
                alt={player.ign ?? "player"}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium truncate">
                {player.ign ?? "Unknown"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {player.id}
              </div>
            </div>
          </div>

          {banned ? (
            <Badge variant="destructive" className="gap-1">
              <BanIcon className="h-3.5 w-3.5" /> Banned
            </Badge>
          ) : (
            <Badge variant="secondary">Active</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="py-3 px-3 sm:px-4">
        {banned ? (
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              <span>
                Banned on{" "}
                {new Intl.DateTimeFormat(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(player.ban!.createdAt))}
              </span>
            </div>
            {player.ban?.reason ? (
              <div className="rounded-md border p-2 text-muted-foreground">
                <div className="text-[11px] uppercase opacity-60 mb-1">
                  Reason
                </div>
                <div className="text-sm leading-snug whitespace-pre-wrap">
                  {player.ban.reason}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No sanctions on record.
          </div>
        )}

        {/* Actions */}
        {isAdmin && (
          <div className="mt-3 flex items-center justify-end">
            {banned ? (
              <Button
                size="sm"
                onClick={() => onUnbanClick(player)}
                disabled={loading}
                className="gap-1.5"
              >
                <ShieldCheck className="h-4 w-4" />
                {loading ? "Unbanning..." : "Unban"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onBanClick(player)}
                disabled={loading}
                className="gap-1.5"
              >
                <ShieldBan className="h-4 w-4" />
                {loading ? "Banning..." : "Ban"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** --- PlayersList (parent) --- */
export default function PlayersList({ players, className }: PlayersListProps) {
  const { data } = useCurrentUser();
  const isAdmin = data?.user?.role === "ADMIN" || data?.user?.role === "OWNER";

  // Keep a local copy so we can update UI without a refetch
  const [items, setItems] = React.useState<PlayerItem[]>(players);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"ban" | "unban">("ban");
  const [target, setTarget] = React.useState<PlayerItem | null>(null);

  React.useEffect(() => {
    // if parent data changes due to navigation, respect it
    setItems(players);
  }, [players]);

  const openBan = (p: PlayerItem) => {
    setTarget(p);
    setDialogMode("ban");
    setDialogOpen(true);
  };
  const openUnban = (p: PlayerItem) => {
    setTarget(p);
    setDialogMode("unban");
    setDialogOpen(true);
  };

  // --- API calls to /api/ban using kyInstance ---
  const doBan = async (userId: string, reason?: string) => {
    setBusyId(userId);
    try {
      const ban = await kyInstance
        .post("/api/ban", { json: { userId, reason } })
        .json<{
          id: string;
          userId: string;
          bannedById: string;
          reason: string | null;
          createdAt: string;
        }>();
      // update local
      setItems((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, ban: { ...ban } } : p))
      );
      toast.success("Player banned");
    } catch (err) {
      const e = await normalizeHttpError(err);
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const doUnban = async (userId: string) => {
    setBusyId(userId);
    try {
      await kyInstance.delete("/api/ban", { json: { userId } });
      // update local
      setItems((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, ban: null } : p))
      );
      toast.success("Player unbanned");
    } catch (err) {
      const e = await normalizeHttpError(err);
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const onDialogConfirm = (reason?: string) => {
    if (!target) return;
    if (dialogMode === "ban") {
      doBan(target.id, reason);
    } else {
      doUnban(target.id);
    }
    setDialogOpen(false);
  };

  return (
    <div className={cn("flex h-full w-full flex-col", className)}>
      <ScrollArea
        className="w-full max-h-[80dvh] rounded-md border p-2 pr-4"
        type="hover"
      >
        <div
          data-scrollable
          className="grid w-full gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              isAdmin={!!isAdmin}
              onBanClick={openBan}
              onUnbanClick={openUnban}
              loading={busyId === p.id}
            />
          ))}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      <BanPlayerDialog
        open={dialogOpen}
        mode={dialogMode}
        player={target}
        onClose={() => setDialogOpen(false)}
        onConfirm={onDialogConfirm}
        isLoading={busyId === target?.id}
      />
    </div>
  );
}
