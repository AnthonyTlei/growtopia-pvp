"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReportSchema, type CreateReportValues } from "@/lib/validation";

type Props = {
  open: boolean;
  onClose: () => void;
  matchId: string;
  isSubmitting?: boolean;
  onSubmit: (values: CreateReportValues) => Promise<void> | void;
};

export default function MatchReportDialog({
  open,
  onClose,
  matchId,
  isSubmitting = false,
  onSubmit,
}: Props) {
  const form = useForm<CreateReportValues>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      matchId,
      message: "",
    },
    mode: "onSubmit",
  });

  const { handleSubmit, control, watch, reset, formState } = form;
  const messageVal = watch("message") ?? "";
  const charCount = messageVal.length;
  const maxChars = 2000;
  const submitting = isSubmitting || formState.isSubmitting;

  function handleOpenChange(next: boolean) {
    if (!next && !submitting) {
      onClose();
      // optional: reset to a clean state when closing
      reset({ matchId, message: "" });
    }
  }

  async function submit(values: CreateReportValues) {
    await onSubmit(values);
    reset({ matchId, message: "" });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-card text-primary sm:max-w-md"
        onInteractOutside={(e) => submitting && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Report match</DialogTitle>
          <DialogDescription>
            Tell us what looks wrong. An admin will review your report.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            {/* Hidden matchId (kept in form state for validation) */}
            {/* No visible field needed; zod ensures it's present and valid */}
            <input
              type="hidden"
              value={matchId}
              {...(form.register("matchId") as {})}
            />

            <FormField
              control={control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain what’s wrong with this match…"
                      rows={6}
                      maxLength={maxChars}
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground text-right">
                    {charCount}/{maxChars}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit report"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
