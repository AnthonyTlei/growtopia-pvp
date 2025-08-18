import Match from "./match";

export default function MatchesList({ matches }: { matches: any[] }) {
  return (
    <div className="flex flex-col gap-4 w-full">
      {matches.map((match, idx) => (
        <Match key={idx} match={match} />
      ))}
    </div>
  );
}
