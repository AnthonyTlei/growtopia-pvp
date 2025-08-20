"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  MoreVertical,
  Pencil,
  Share2,
  XCircle,
  Trash2,
  Flag,
} from "lucide-react";
import type { MatchStatus } from "@prisma/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { MatchWithParticipants } from "@/types/prisma-includes";
import CreateEditMatchDialog from "./create-edit-match-dialog";
import { useDeleteMatchMutation } from "@/hooks/use-matches";
import MatchCancelDeleteDialog from "./match-cancel-delete-dialog";
import MatchReportDialog from "./match-report-dialog";
import { useCreateReport } from "@/hooks/use-reports";

type Props = {
  matchId: string;
  createdById?: string | null;
  status: MatchStatus;
  initialMatch?: MatchWithParticipants;
};

export default function MatchActions({
  matchId,
  createdById,
  status,
  initialMatch,
}: Props) {
  const { data } = useCurrentUser();
  const user = data?.user;

  const isAdmin = user?.role === "ADMIN" || user?.role === "OWNER";
  const isCreator = !!user?.id && !!createdById && user.id === createdById;
  const isActive = status === "PENDING";

  const canEdit = isActive && (isCreator || isAdmin);
  const canCancel = isActive && (isCreator || isAdmin);
  const canDelete = !!isAdmin;
  const canShare = true;
  const canReport = !!user;

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmMode, setConfirmMode] = React.useState<"cancel" | "delete">(
    "cancel"
  );

  const [openReport, setOpenReport] = React.useState(false);

  const deleteMutation = useDeleteMatchMutation();
  const createReport = useCreateReport();

  const onEdit = () => {
    setMenuOpen(false);
    setOpenEdit(true);
  };

  const openCancel = () => {
    setMenuOpen(false);
    setConfirmMode("cancel");
    setConfirmOpen(true);
  };

  const openDelete = () => {
    setMenuOpen(false);
    setConfirmMode("delete");
    setConfirmOpen(true);
  };

  const onConfirm = () => {
    deleteMutation.mutate(matchId, {
      onSuccess: () => {
        toast.success(
          confirmMode === "cancel" ? "Match cancelled" : "Match deleted"
        );
        setConfirmOpen(false);
      },
      onError: (e) => {
        toast.error(e instanceof Error ? e.message : "Failed");
      },
    });
  };

  const onShare = async () => {
    const url = `${window.location.origin}/matches/${matchId}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: "Match" });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {}
  };

  const onReport = () => {
    setMenuOpen(false);
    setOpenReport(true);
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="More"
            disabled={deleteMutation.isPending || createReport.isPending}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          {canEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}

          {canCancel && (
            <DropdownMenuItem onClick={openCancel}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </DropdownMenuItem>
          )}

          {(canEdit || canCancel) && <DropdownMenuSeparator />}

          {canShare && (
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
          )}

          {canReport && (
            <DropdownMenuItem
              onClick={onReport}
              disabled={createReport.isPending}
            >
              <Flag className="mr-2 h-4 w-4" />
              {createReport.isPending ? "Reporting…" : "Report"}
            </DropdownMenuItem>
          )}

          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700"
                onClick={openDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canEdit && initialMatch && (
        <CreateEditMatchDialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          mode="edit"
          initialMatch={initialMatch}
        />
      )}

      {/* Cancel/Delete confirmation */}
      <MatchCancelDeleteDialog
        open={confirmOpen}
        mode={confirmMode}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirm}
        isLoading={deleteMutation.isPending}
      />

      {/* Report dialog */}
      <MatchReportDialog
        open={openReport}
        onClose={() => setOpenReport(false)}
        matchId={matchId}
        isSubmitting={createReport.isPending}
        onSubmit={async (values) => {
          try {
            await createReport.mutateAsync(values);
            toast.success("Report submitted");
            setOpenReport(false);
          } catch (e) {
            toast.error(
              e instanceof Error ? e.message : "Failed to submit report"
            );
          }
        }}
      />
    </>
  );
}
