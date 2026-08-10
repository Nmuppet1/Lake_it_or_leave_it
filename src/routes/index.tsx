import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { MapCanvas } from "@/components/MapCanvas";
import { SwimCard } from "@/components/SwimCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteSwim,
  fetchSwims,
  pickSwimOfTheDay,
  swimsQueryKey,
  type Swim,
} from "@/lib/swims";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lake it or leave it · A map of wild swims" },
      {
        name: "description",
        content:
          "Lake it or leave it is a map of wild swims. Log in and share where the water is good!",
      },
      { property: "og:title", content: "Lake it or leave it · A map of wild swims" },
      {
        property: "og:description",
        content: "Drop a pin, add a photo and review your wild swims.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [panelOpen, setPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [sort, setSort] = useState("newest");

  const { data: swims, isLoading } = useQuery({
    queryKey: swimsQueryKey,
    queryFn: fetchSwims,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSwim,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: swimsQueryKey });
      toast.success("Swim deleted");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not delete the swim");
    },
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const floor = Number(minRating);
    const list = (swims ?? []).filter((swim) => {
      const matches =
        !query ||
        swim.spot_name.toLowerCase().includes(query) ||
        (swim.review ?? "").toLowerCase().includes(query) ||
        (swim.username ?? "").toLowerCase().includes(query);
      return matches && swim.rating >= floor;
    });

    return [...list].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "oldest") return a.swam_on.localeCompare(b.swam_on);
      if (sort === "name") return a.spot_name.localeCompare(b.spot_name);
      return b.created_at.localeCompare(a.created_at);
    });
  }, [swims, search, minRating, sort]);

  const swimOfTheDay = useMemo(() => pickSwimOfTheDay(swims ?? []), [swims]);

  function revealSwimOfTheDay() {
    if (!swimOfTheDay) return;
    setSearch("");
    setMinRating("0");
    setPanelOpen(true);
    requestAnimationFrame(() => {
      document
        .getElementById(`swim-card-${swimOfTheDay.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h1 className="text-2xl leading-none">Lake it or leave it</h1>
          <p className="label-eyebrow mt-1">A MAP OF SOME PRETTY WILD SWIMS</p>
        </div>
        <nav className="flex items-center gap-2">
            {swimOfTheDay ? (
            <Button
              size="sm"
              variant="outline"
              className="border-accent text-accent hover:text-accent"
              onClick={revealSwimOfTheDay}
            >
              Swim of the day: {swimOfTheDay.spot_name}
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => setPanelOpen((open) => !open)}>
            {panelOpen ? "Hide swims page" : `Open swims${swims ? ` (${swims.length})` : ""}`}
          </Button>

          {user ? (
            <>
              <Button asChild size="sm">
                <Link to="/new">Log a swim</Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const { error } = await supabase.auth.signOut();
                  if (error) toast.error("Could not sign out");
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <main className="min-h-0 flex-1">
          <MapCanvas swims={filtered} />
        </main>

        {!panelOpen ? (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="surface-frost absolute right-0 top-6 z-[500] rounded-l-lg px-3 py-4 text-xs tracking-[0.18em] uppercase text-muted-foreground hover:text-primary"
            style={{ writingMode: "vertical-rl" }}
          >
            Open swims
          </button>
        ) : null}

        <aside
          className={`absolute right-0 top-0 z-[600] h-full w-full max-w-md border-l border-border bg-background/95 backdrop-blur transition-transform duration-300 sm:w-[26rem] ${
            panelOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
          }`}
          aria-hidden={!panelOpen}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
              <h2 className="label-eyebrow">
                {isLoading ? "LOADING SWIMS" : `${filtered.length} SWIMS`}
              </h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-3 border-b border-border px-5 py-4">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search for a spot, review or a swimmer"
              />
              <div className="flex gap-2">
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Min rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any rating</SelectItem>
                    <SelectItem value="3">3+ 💧</SelectItem>
                    <SelectItem value="4">4+ 💧</SelectItem>
                    <SelectItem value="5">5 💧</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="rating">Best rated</SelectItem>
                    <SelectItem value="name">A–Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {!isLoading && filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {user
                    ? "No swims match that filter."
                    : "You should sign in! You can then log some awesome swims ;)"}
                </p>
              ) : null}
              {filtered.map((swim: Swim) => (
                <SwimCard
                  key={swim.id}
                  swim={swim}
                  isOwner={swim.user_id === user?.id}
                  highlight={swim.id === swimOfTheDay?.id}
                  onDelete={(target) => deleteMutation.mutate(target)}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
