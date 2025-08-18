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
import { useTransition } from "react";
import { acceptTermsAndConditions } from "@/lib/users";
import { useRouter } from "next/navigation";

type TermsAndConditionsProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function TermsAndConditions({
  open,
  onOpenChange,
}: TermsAndConditionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const handleAgree = () => {
    startTransition(async () => {
      try {
        await acceptTermsAndConditions();
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        console.error("Failed to accept terms:", err);
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
      <DialogContent
        className="sm:max-w-lg"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Terms &amp; Conditions</DialogTitle>
          <DialogDescription>
            Please review the following before using Growtopia PvP.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4 text-sm leading-6">
            <p>
              This platform is a community‑maintained project designed for
              Growtopia PvP players to record 1v1 matches and view rankings via
              an ELO‑style rating system.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                The service is free to use and aims to stay free to develop and
                maintain. Volunteer, community‑selected <strong>Admins</strong>
                &nbsp;help moderate matches and player activity.
              </li>
              <li>
                We expect players to act in good faith: do not spam the server,
                submit fake matches, or provide false information.
              </li>
              <li>
                Admins reserve the right to remove suspicious or fake matches
                and to suspend or ban accounts that abuse the system.
              </li>
            </ul>
            <p>
              By continuing, you confirm you have read and accept these terms.
            </p>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={handleAgree} disabled={isPending}>
            {isPending ? "Saving..." : "Agree & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
