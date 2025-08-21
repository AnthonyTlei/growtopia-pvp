import ReportsList from "@/components/reports/reports-list";
import { getUser } from "@/lib/auth-utils";
import { Role } from "@prisma/client";

export default async function ReportsPage() {
  const user = await getUser();
  return (
    <main className="w-full h-full flex justify-center items-center gap-8 flex-col">
      <div className="w-full h-full p-4 flex justify-start items-start flex-col gap-4">
        <h1 className="w-full text-start text-2xl font-bold">
          {user?.role == Role.ADMIN || user?.role == Role.OWNER
            ? "Reports"
            : "Your Reports"}
        </h1>
        <ReportsList />
      </div>
    </main>
  );
}
