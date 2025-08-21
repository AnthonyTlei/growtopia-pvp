"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { signOut } from "next-auth/react";

type BanInfo = {
  createdAt: Date | string;
  reason?: string | null;
};

type BannedDialogProps = {
  /** Pass the user's ban (or null). If null/undefined, renders nothing. */
  ban?: BanInfo | null;
  /** Force-open override. Defaults to true when `ban` is present. */
  open?: boolean;
  /** Optional callback after sign-out is triggered */
  onSignedOut?: () => void;
};

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

export default function BannedDialog({
  ban,
  open,
  onSignedOut,
}: BannedDialogProps) {
  // If there is no ban, render nothing
  if (!ban) return null;

  const isOpen = open ?? true;

  const handleSignOut = async () => {
    try {
      await signOut(); // next-auth/react
      onSignedOut?.();
    } catch {
      // no-op; next-auth handles redirect/errors internally
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        /* locked */
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        // Prevent closing via backdrop or ESC
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Account Banned
          </DialogTitle>
          <DialogDescription>
            Your account has been banned. You can sign out below.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3 text-sm">
          <div className="rounded-md border bg-muted/40 p-3">
            <div className="text-xs text-muted-foreground">Banned on</div>
            <div className="font-medium">{formatDate(ban.createdAt)}</div>
          </div>

          {ban.reason ? (
            <div className="rounded-md border bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">Reason</div>
              <p className="whitespace-pre-wrap">{ban.reason}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No reason was provided by the admins.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            If you believe this is a mistake, please contact an admin.
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <Button className="w-full" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
