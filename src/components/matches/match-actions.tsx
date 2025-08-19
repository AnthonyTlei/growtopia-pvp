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

type Props = {
  matchId: string;
  createdById?: string | null;
  status: MatchStatus;
};

export default function MatchActions({ matchId, createdById, status }: Props) {
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

  const onEdit = () => {
    router.push(`/matches/${matchId}/edit`);
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
    <DropdownMenu>
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
  );
}
