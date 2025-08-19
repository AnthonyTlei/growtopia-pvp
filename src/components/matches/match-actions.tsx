"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import ky from "@/lib/ky";
import { MoreVertical, Pencil, Share2, XCircle, Trash2 } from "lucide-react";
import type { MatchStatus } from "@prisma/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { MatchWithParticipants } from "@/types/prisma-includes";
import CreateEditMatchDialog from "./create-edit-match-dialog";

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
  const router = useRouter();
  const { data } = useCurrentUser();
  const user = data?.user;

  const isAdmin = user?.role === "ADMIN" || user?.role === "OWNER";
  const isCreator = !!user?.id && !!createdById && user.id === createdById;
  const isActive = status === "PENDING";

  const canEdit = isActive && (isCreator || isAdmin);
  const canCancel = isActive && (isCreator || isAdmin);
  const canDelete = !!isAdmin;
  const canShare = true;

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);

  const onEdit = () => {
    setMenuOpen(false);
    setOpenEdit(true);
  };

  const onCancel = async () => {
    try {
      await ky.post(`/api/matches/${matchId}/cancel`);
      toast.success("Match cancelled");
      router.refresh();
    } catch (e) {
      toast.error("Failed to cancel match");
      console.error(e);
    }
  };

  const onDelete = async () => {
    if (!confirm("Delete this match? This cannot be undone.")) return;
    try {
      await ky.delete(`/api/matches/${matchId}`);
      toast.success("Match deleted");
      router.refresh();
    } catch (e) {
      toast.error("Failed to delete match");
      console.error(e);
    }
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

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          {canEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}

          {canCancel && (
            <DropdownMenuItem onClick={onCancel}>
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

          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create/Edit Dialog in edit mode */}
      {canEdit && initialMatch && (
        <CreateEditMatchDialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          mode="edit"
          initialMatch={initialMatch}
        />
      )}
    </>
  );
}
