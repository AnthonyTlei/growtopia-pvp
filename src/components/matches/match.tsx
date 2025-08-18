export default function Match({ match }: { match: any }) {
  return (
    <div className="p-4 rounded-xl shadow">
      <div className="font-bold">
        {match.players[0]} vs {match.players[1]}
      </div>
      <div className="text-sm ">
        Created: {new Date(match.creation_date).toLocaleString()} <br />
        Completed: {new Date(match.completion_date).toLocaleString()} <br />
        Rated: {match.rated ? "Yes" : "No"}
      </div>
    </div>
  );
}
