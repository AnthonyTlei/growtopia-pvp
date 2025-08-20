"use client";

import kyInstance from "@/lib/ky";
import { HTTPError } from "ky";
import { toast } from "sonner";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import type { ReportWithRelations } from "@/lib/reports";

/** Single source of truth for the list key */
const REPORTS_KEY = ["reports", "list"] as const;

/** --- HTTP helpers --- */
async function normalizeHttpError(err: unknown): Promise<Error> {
  if (err instanceof HTTPError) {
    let message = `${err.response.status} ${err.response.statusText}`;
    try {
      const data = (await err.response.clone().json()) as { message?: string };
      if (data?.message) message = data.message;
    } catch {
      try {
        const txt = await err.response.text();
        if (txt) message = txt;
      } catch {}
    }
    return new Error(message);
  }
  return err instanceof Error ? err : new Error("Request failed");
}

async function getReportsRequest(): Promise<ReportWithRelations[]> {
  try {
    return await kyInstance.get("/api/reports").json<ReportWithRelations[]>();
  } catch (err) {
    throw await normalizeHttpError(err);
  }
}

async function createReportRequest(args: {
  matchId: string;
  message?: string;
}): Promise<ReportWithRelations> {
  try {
    return await kyInstance
      .post("/api/reports", { json: args })
      .json<ReportWithRelations>();
  } catch (err) {
    throw await normalizeHttpError(err);
  }
}

async function acceptReportRequest(
  id: string
): Promise<
  { id: string; deletedMatchId?: string } | ReportWithRelations | void
> {
  try {
    const res = await kyInstance.post(`/api/reports/${id}/accept`);
    if (res.status === 204) return;
    const data = await res.json<
      { id: string; deletedMatchId?: string } | ReportWithRelations
    >();
    return data;
  } catch (err) {
    throw await normalizeHttpError(err);
  }
}

async function rejectReportRequest(
  id: string
): Promise<ReportWithRelations | { id: string; status: string } | void> {
  try {
    const res = await kyInstance.post(`/api/reports/${id}/reject`);
    if (res.status === 204) return;
    const data = await res.json<
      ReportWithRelations | { id: string; status: string }
    >();
    return data;
  } catch (err) {
    throw await normalizeHttpError(err);
  }
}

/** --- Cache helpers --- */
function pushReport(qc: QueryClient, created: ReportWithRelations) {
  qc.setQueryData<ReportWithRelations[] | undefined>(REPORTS_KEY, (prev) => {
    if (!prev) return [created];
    const without = prev.filter((r) => r.id !== created.id);
    return [created, ...without];
  });
}

function removeReport(qc: QueryClient, id: string) {
  qc.setQueryData<ReportWithRelations[] | undefined>(REPORTS_KEY, (prev) =>
    prev ? prev.filter((r) => r.id !== id) : prev
  );
}

function updateReportStatus(
  qc: QueryClient,
  id: string,
  status: ReportWithRelations["status"] | string
) {
  qc.setQueryData<ReportWithRelations[] | undefined>(REPORTS_KEY, (prev) =>
    prev
      ? prev.map((r) =>
          r.id === id ? ({ ...r, status } as ReportWithRelations) : r
        )
      : prev
  );
}

/** 1) List reports */
export function useReports() {
  return useQuery<ReportWithRelations[], Error>({
    queryKey: REPORTS_KEY,
    queryFn: getReportsRequest,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}

/** 2) Create a report */
export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReportRequest,
    onSuccess: (created) => {
      pushReport(queryClient, created);
      toast.success("Report submitted");
    },
    onError: async (error) => {
      const e = await normalizeHttpError(error);
      toast.error(e.message);
      console.error("createReport failed:", error);
    },
  });
}

/** 3) Accept a report (admin/owner). Removes it from cache. */
export function useAcceptReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => acceptReportRequest(id),
    onSuccess: (_res, id) => {
      removeReport(queryClient, id);
      toast.success("Report accepted");
    },
    onError: async (error) => {
      const e = await normalizeHttpError(error);
      toast.error(e.message);
      console.error("acceptReport failed:", error);
    },
  });
}

/** 4) Reject a report (admin/owner). Marks status CLOSED in cache. */
export function useRejectReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rejectReportRequest(id),
    onSuccess: (res, id) => {
      if (res && typeof res === "object" && "id" in res && "status" in res) {
        updateReportStatus(queryClient, res.id as string, res.status as string);
      } else {
        updateReportStatus(queryClient, id, "CLOSED");
      }
      toast.success("Report closed");
    },
    onError: async (error) => {
      const e = await normalizeHttpError(error);
      toast.error(e.message);
      console.error("rejectReport failed:", error);
    },
  });
}
