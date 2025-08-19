"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

type Props = {
  open: boolean;
  mode: "cancel" | "delete";
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function MatchCancelDeleteDialog({
  open,
  mode,
  isLoading = false,
  onClose,
  onConfirm,
}: Props) {
  const isDelete = mode === "delete";
  const title = isDelete ? "Delete match?" : "Cancel match?";
  const description = isDelete
    ? "This will permanently delete the match. For rated & completed matches, ELO will be reverted as configured."
    : "This will cancel the pending match. This action cannot be undone.";

  const confirmLabel = isDelete
    ? isLoading
      ? "Deleting..."
      : "Delete"
    : isLoading
    ? "Cancelling..."
    : "Cancel";

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => !isLoading && !v && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className={isDelete ? "text-red-600" : ""}>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={onClose}>
            Close
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={isDelete ? "bg-red-600 text-white hover:bg-red-700" : ""}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
