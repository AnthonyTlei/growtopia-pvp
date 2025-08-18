"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useTransition, useState } from "react";
import { setInGameName } from "@/lib/users";
import { toast } from "sonner";

type SetNamePromptProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function IgnPrompt({ open, onOpenChange }: SetNamePromptProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const handleAgree = () => {
    const value = name.trim();
    if (!value) return;
    startTransition(async () => {
      try {
        await setInGameName(value);
        toast.success("Name set successfully");
        onOpenChange(false);
      } catch (err) {
        console.error("Failed to set name:", err);
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : "Something went wrong while setting your name";
        toast.error(message);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Account Name</DialogTitle>
          <DialogDescription>
            Please set your name in Growtopia which will be displayed in the
            matches.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4 text-sm leading-6">
            <p>
              By continuing, you confirm that this is your current name in
              Growtopia.
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <Input
              id="ign"
              placeholder="e.g. cva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={handleAgree}
            disabled={isPending || name.trim().length === 0}
          >
            {isPending ? "Saving..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
