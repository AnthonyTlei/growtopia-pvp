import { redirect } from "next/navigation";

export default async function Home() {
  // Remove when built
  redirect("/matches");
  return (
    <main className="w-full h-full flex justify-center items-center gap-8 flex-col">
      <div className="w-full h-full p-4 flex justify-start items-start flex-col gap-4">
        <h1 className="w-full text-start text-2xl font-bold">
          Recent Annoucements
        </h1>
        <h1 className="w-full text-start text-2xl font-bold">Recent Matches</h1>
        <h1 className="w-full text-start text-2xl font-bold">
          Recent Rankings
        </h1>
      </div>
    </main>
  );
}
