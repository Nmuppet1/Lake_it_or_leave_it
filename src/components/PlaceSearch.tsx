import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Result = { label: string; lat: number; lng: number };

export function PlaceSearch({
  onPick,
}: {
  onPick: (place: { lat: number; lng: number; label: string }) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function search() {
    const term = query.trim();
    if (!term) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(term)}`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error("Search failed");
      const data = (await response.json()) as Array<{
        display_name: string;
        lat: string;
        lon: string;
      }>;
      const found = data.map((item) => ({
        label: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
      }));
      setResults(found);
      if (found.length === 0) setMessage("Sorry, nothing found for that :-(");
    } catch {
      setMessage("Whoops, can't search places right now :-(");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void search();
            }
          }}
          placeholder="Search for a location here"
          aria-label="Search for a place on the map"
        />
        <Button type="button" variant="outline" onClick={() => void search()} disabled={busy}>
          {busy ? "Looking for it..." : "Search"}
        </Button>
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      {results.length > 0 ? (
        <ul className="surface-frost max-h-40 divide-y divide-border overflow-y-auto rounded-md">
          {results.map((result) => (
            <li key={`${result.lat},${result.lng}`}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-foreground/85 hover:text-primary"
                onClick={() => {
                  onPick(result);
                  setResults([]);
                }}
              >
                {result.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
