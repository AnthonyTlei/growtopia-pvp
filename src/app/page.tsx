import MatchesList from "@/components/matches/matches-list";
import { getUser } from "@/lib/auth-utils";
import { getMatches } from "@/lib/matches";

export default async function Home() {
  const user = await getUser();
  let matches = await getMatches();
  matches = matches.sort(
    (a, b) =>
      new Date(b.completion_date).getTime() -
      new Date(a.completion_date).getTime()
  );

  return (
    <main className="w-full h-full flex justify-center items-center gap-8 flex-col">
      <div className="w-full h-full p-4 flex justify-center items-center flex-col gap-4">
        <h1 className="w-full text-start text-2xl font-bold">Recent Matches</h1>
        <MatchesList matches={matches} />
      </div>
    </main>
  );
}
