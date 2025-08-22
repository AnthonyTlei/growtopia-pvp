import PlayersRankingsTable from "@/components/rankings/players-rankings-table";
import { getPlayersRankings } from "@/lib/players";

export default async function RankingsPage() {
  const players = await getPlayersRankings();
  return (
    <main className="w-full h-full flex justify-center items-center gap-8 flex-col">
      <div className="w-full h-full p-4 flex justify-start items-start flex-col gap-4">
        <h1 className="w-full text-start text-2xl font-bold">Rankings</h1>
        <PlayersRankingsTable players={players} />
      </div>
    </main>
  );
}
