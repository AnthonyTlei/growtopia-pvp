"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronsUpDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ky from "ky"; // or your kyInstance

export type Player = { id: string; ign: string | null; image?: string | null };

type PlayerSearchProps = {
  value?: string | null;
  onChange: (userId: string | null, player?: Player | null) => void;
  disabled?: boolean;
  className?: string;
  excludeIds?: string[];
  placeholder?: string;
  allowClear?: boolean;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function scorePlayer(p: Player, q: string) {
  // crude ranking: exact IGN start > IGN includes > id includes
  const ign = (p.ign ?? "").toLowerCase();
  if (!q) return 0;
  if (ign.startsWith(q)) return 0; // best
  if (ign.includes(q)) return 1; // mid
  if (p.id.toLowerCase().includes(q)) return 2; // fallback
  return 3; // worst
}

export default function PlayerSearch({
  value,
  onChange,
  disabled,
  className,
  excludeIds = [],
  placeholder = "Search player by IGN or ID...",
  allowClear = true,
}: PlayerSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selected = React.useMemo(
    () => players.find((p) => p.id === value) || null,
    [players, value]
  );

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ky.get("/api/players").json<Player[]>();
        if (!mounted) return;
        setPlayers(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!mounted) return;
        setError("Failed to load players");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredTop3 = React.useMemo(() => {
    const q = normalize(query);
    const excluded = new Set(excludeIds);
    return players
      .filter((p) => !excluded.has(p.id))
      .filter((p) => {
        if (!q) return true;
        const ign = normalize(p.ign ?? "");
        return ign.includes(q) || p.id.toLowerCase().includes(q);
      })
      .sort((a, b) => scorePlayer(a, q).valueOf() - scorePlayer(b, q).valueOf())
      .slice(0, 3);
  }, [players, query, excludeIds]);

  return (
    <div className={cn("w-full", className)}>
      <Popover modal open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !selected && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 truncate">
              {selected ? (
                <>
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={selected.image ?? undefined}
                      alt={selected.ign ?? "player"}
                    />
                    <AvatarFallback>
                      {(selected.ign ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">
                    {selected.ign ?? selected.id}
                  </span>
                </>
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {allowClear && selected && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear selection"
                  className="p-0.5 rounded hover:bg-accent/50 outline-none"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(null, null);
                    setQuery("");
                    setOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onChange(null, null);
                      setQuery("");
                      setOpen(false);
                    }
                  }}
                >
                  <X className="h-4 w-4 opacity-60 hover:opacity-100" />
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder={placeholder}
              disabled={disabled}
            />
            <CommandList>
              {loading && <CommandEmpty>Loading players…</CommandEmpty>}
              {!loading && error && <CommandEmpty>{error}</CommandEmpty>}
              {!loading && !error && filteredTop3.length === 0 && (
                <CommandEmpty>No players found.</CommandEmpty>
              )}

              {!loading && !error && filteredTop3.length > 0 && (
                <CommandGroup heading="Players">
                  {filteredTop3.map((p) => {
                    const isSelected = p.id === value;
                    return (
                      <CommandItem
                        key={p.id}
                        value={p.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onSelect={() => {
                          onChange(p.id, p);
                          setOpen(false);
                          setQuery("");
                        }}
                      >
                        <div className="mr-2 flex h-5 w-5 items-center justify-center">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </div>
                        <Avatar className="mr-2 h-5 w-5">
                          <AvatarImage
                            src={p.image ?? undefined}
                            alt={p.ign ?? "player"}
                          />
                          <AvatarFallback>
                            {(p.ign ?? "?").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">
                            {p.ign ?? "Unknown"}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {p.id}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
