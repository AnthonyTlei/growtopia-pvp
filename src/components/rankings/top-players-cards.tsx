"use client";

import * as React from "react";
import type { PlayerRanking } from "@/components/rankings/players-rankings-table";

type Props = {
  players: PlayerRanking[];
};

export default function TopPlayersCards({ players }: Props) {
  const top3 = React.useMemo(() => {
    return [...players].sort((a, b) => b.elo - a.elo).slice(0, 3);
  }, [players]);

  const podiumHeights = [120, 100, 80];
  const podiumColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

  return (
    <div className="flex justify-center items-end gap-6 mt-6">
      {top3.map((player, index) => (
        <div key={player.id} className="flex flex-col items-center">
          <div className="relative">
            <img
              src={player.image ?? "/default-avatar.png"}
              alt={player.ign ?? "Unknown"}
              className="h-16 w-16 rounded-full border-4 border-white shadow-lg object-cover"
            />
            <span className="absolute -top-3 -right-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              #{index + 1}
            </span>
          </div>

          <div
            className="w-20 rounded-t-lg shadow-md transition-transform transform hover:scale-105"
            style={{
              height: `${podiumHeights[index]}px`,
              backgroundColor: podiumColors[index],
            }}
          />

          <div className="mt-2 text-center">
            <p className="font-semibold truncate w-20">{player.ign ?? "Unknown"}</p>
            <p className="text-sm text-gray-700">{player.elo} ELO</p>
          </div>
        </div>
      ))}
    </div>
  );
}
