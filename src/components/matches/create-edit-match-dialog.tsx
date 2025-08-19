"use client";

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createMatchSchema,
  MatchStatusEnum,
  type CreateMatchValues,
} from "@/lib/validation";
import { useEffect, useMemo } from "react";
import PlayerSearch from "../utilities/player-search";
import {
  useCreateMatchMutation,
  useEditMatchMutation,
} from "@/hooks/use-matches";
import type { MatchWithParticipants } from "@/types/prisma-includes";

type Mode = "create" | "edit";

interface CreateEditMatchDialogProps {
  open: boolean;
  onClose: () => void;
  mode?: Mode; // default "create"
  /** Required in edit mode to prefill and provide id */
  initialMatch?: MatchWithParticipants;
}

function toFormValues(match?: MatchWithParticipants): CreateMatchValues {
  if (!match) {
    return {
      status: "PENDING",
      rated: false,
      participants: [
        { userId: "", score: 0 },
        { userId: "", score: 0 },
      ],
      winnerId: undefined,
    };
  }
  const [p1, p2] =
    match.participants.length === 2
      ? match.participants
      : [
          { userId: "", score: 0 },
          { userId: "", score: 0 },
        ];

  return {
    status: match.status,
    rated: !!match.rated,
    participants: [
      { userId: p1.userId ?? "", score: p1.score ?? 0 },
      { userId: p2.userId ?? "", score: p2.score ?? 0 },
    ],
    winnerId: match.winnerId ?? undefined,
  };
}

export default function CreateEditMatchDialog({
  open,
  onClose,
  mode = "create",
  initialMatch,
}: CreateEditMatchDialogProps) {
  const createMutation = useCreateMatchMutation();
  const editMutation = useEditMatchMutation();

  const form = useForm<CreateMatchValues>({
    resolver: zodResolver(createMatchSchema),
    defaultValues: toFormValues(initialMatch),
    mode: "onSubmit",
  });

  const { control, watch, handleSubmit, reset, formState, setValue } = form;

  useEffect(() => {
    if (open) reset(toFormValues(initialMatch));
  }, [open, initialMatch?.id]);

  const status = watch("status");

  const { fields } = useFieldArray({
    control,
    name: "participants",
  });

  const isSubmitting =
    formState.isSubmitting ||
    createMutation.isPending ||
    editMutation.isPending;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isSubmitting) onClose();
  }

  const onSubmit = async (values: CreateMatchValues) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(values);
      } else {
        if (!initialMatch?.id) {
          throw new Error("Missing match id for edit.");
        }
        await editMutation.mutateAsync({ id: initialMatch.id, data: values });
      }
      reset();
      onClose();
    } catch (err) {
      console.error(`${mode} match failed:`, err);
    }
  };

  const showWinner = useMemo(() => status === "COMPLETED", [status]);
  const showScore = useMemo(() => status !== "PENDING", [status]);

  const title = mode === "edit" ? "Edit Match" : "Create a Match";
  const description =
    mode === "edit"
      ? "Update match details and scores."
      : "Set a new match or record a completed one.";
  const cta = isSubmitting
    ? mode === "edit"
      ? "Saving..."
      : "Creating..."
    : mode === "edit"
    ? "Save changes"
    : "Create Match";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-card text-primary h-full opacity-100 md:h-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Status */}
            <FormField
              control={control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      disabled={isSubmitting}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {MatchStatusEnum.options.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rated */}
            <FormField
              control={control}
              name="rated"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-1">
                    <FormLabel>Rated match?</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Affects player ratings if enabled.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      disabled={isSubmitting}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Participants */}
            <div className="grid gap-4">
              <h4 className="font-medium">Participants</h4>
              {fields.map((f, idx) => (
                <div key={f.id} className="space-y-3 rounded-md border p-3">
                  {/* Player selector */}
                  <FormField
                    control={control}
                    name={`participants.${idx}.userId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Player {idx + 1}</FormLabel>
                        <FormControl>
                          <PlayerSearch
                            value={field.value ?? ""}
                            disabled={isSubmitting}
                            excludeIds={
                              fields
                                .map((_, i) =>
                                  i === idx
                                    ? null
                                    : watch(`participants.${i}.userId`)
                                )
                                .filter(Boolean) as string[]
                            }
                            onChange={(id) => {
                              setValue(`participants.${idx}.userId`, id ?? "", {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Score input */}
                  {showScore && (
                    <FormField
                      control={control}
                      name={`participants.${idx}.score`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Player {idx + 1} Score</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              step={1}
                              value={field.value ?? 0}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                field.onChange(Number.isNaN(n) ? 0 : n);
                              }}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Winner (only for COMPLETED) */}
            {showWinner && (
              <FormField
                control={control}
                name="winnerId"
                render={({ field }) => {
                  const p1 = watch("participants.0.userId");
                  const p2 = watch("participants.1.userId");
                  const participantIds = [p1, p2].filter(Boolean) as string[];
                  const disabledWinner =
                    isSubmitting || participantIds.length < 2;

                  return (
                    <FormItem>
                      <FormLabel>Winner</FormLabel>
                      <FormControl>
                        <Select
                          disabled={disabledWinner}
                          value={field.value ?? ""}
                          onValueChange={(v) => field.onChange(v)}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                disabledWinner
                                  ? "Select both players first"
                                  : "Select winner"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {participantIds.map((id, idx) => (
                              <SelectItem key={id} value={id}>
                                {`Player ${idx + 1}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {cta}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
