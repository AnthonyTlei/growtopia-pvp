"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useReports } from "@/hooks/use-reports";
import ReportCard from "./report-card";

export default function ReportsList() {
  const { data: reports = [], isLoading, isError } = useReports();

  if (isLoading && reports.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 w-full">
        <div className="flex flex-col items-center justify-center rounded-md border p-4 shadow">
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border p-4 shadow">
        <p>Failed to load reports.</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 w-full">
        <div className="flex flex-col items-center justify-center rounded-md border p-4 shadow">
          <p>No reports found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-stretch">
      <ScrollArea
        className="w-full max-h-[80dvh] rounded-md border p-2 pr-4"
        type="hover"
      >
        <div
          data-scrollable
          className="grid h-fit w-full grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}
