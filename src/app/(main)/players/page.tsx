import PlayersList from "@/components/players/players-list";
import { getPlayers } from "@/lib/players";

export default async function PlayersPage() {
  const players = await getPlayers();
  return (
    <main className="w-full h-full flex justify-center items-center gap-8 flex-col">
      <div className="w-full h-full p-4 flex justify-start items-start flex-col gap-4">
        <h1 className="w-full text-start text-2xl font-bold">Players</h1>
        <PlayersList players={players} />
      </div>
    </main>
  );
}
