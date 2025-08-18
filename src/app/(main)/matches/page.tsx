import CreateMatchFAB from "@/components/matches/create-match-fab";
import MatchesList from "@/components/matches/matches-list";
import { getUser } from "@/lib/auth-utils";

export default async function MatchesPage() {
  const user = await getUser();
  return (
    <main className="w-full h-full flex justify-center items-center gap-8 flex-col">
      <div className="w-full h-full p-4 flex justify-start items-start flex-col gap-4">
        <h1 className="w-full text-start text-2xl font-bold">Matches</h1>
        <MatchesList />
      </div>
      {user && user.acceptedTerms && user.ign && <CreateMatchFAB />}
    </main>
  );
}
