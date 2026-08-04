import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";

import { MapCanvas } from "@/components/MapCanvas";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { deleteSwim, fetchSwims, formatTemp, swimsQueryKey, type Swim } from "@/lib/swims";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Frozen Assets · A map of wild swims" },
      {
        name: "description",
        content:
          "Frozen Assets is a quiet map of wild swims. Drop a pin, add a photo, log the water temperature and share where the cold water is good.",
      },
      { property: "og:title", content: "Frozen Assets · A map of wild swims" },
      {
        property: "og:description",
        content: "Drop a pin, add a photo and log the water temperature of your wild swims.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function SwimCard({
  swim,
  isOwner,
  onDelete,
}: {
  swim: Swim;
  isOwner: boolean;
  onDelete: (swim: Swim) => void;
}) {
  return (
    <article className="surface-frost overflow-hidden rounded-lg">
      {swim.photo_url ? (
        <img
          src={swim.photo_url}
          alt={`Wild swim at ${swim.spot_name}`}
          className="h-44 w-full object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="space-y-2 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xl">{swim.spot_name}</h3>
          <span className="text-sm text-accent">{"★".repeat(swim.rating)}</span>
        </div>
        <p className="label-eyebrow">
          {formatTemp(swim.water_temp_c)} · {swim.swam_on}
          {swim.conditions ? ` · ${swim.conditions}` : ""}
        </p>
        {swim.review ? <p className="text-sm text-foreground/85">{swim.review}</p> : null}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{swim.username ?? "someone"}</p>
          {isOwner ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="text-xs text-destructive hover:text-destructive/80"
                >
                  Delete
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this swim?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove {swim.spot_name} and its photo. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(swim)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Index() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
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

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <div>
          <h1 className="text-2xl leading-none">Frozen Assets</h1>
          <p className="label-eyebrow mt-1">A MAP OF SOME PRETTY WILD SWIMS</p>
        </div>
        <nav className="flex items-center gap-2">
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

      <section className="mx-auto max-w-6xl px-6">
        <div className="h-[60vh] min-h-80 overflow-hidden rounded-lg border border-border">
          <MapCanvas swims={swims ?? []} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="label-eyebrow">
          {isLoading ? "Loading swims" : `${swims?.length ?? 0} swims logged`}
        </h2>
        {!isLoading && (swims?.length ?? 0) === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {user ? "Nothing here yet. Be the first — log a swim." : "You should sign in! You can then log some awesome swims ;)"}
          </p>
        ) : null}
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(swims ?? []).map((swim) => (
            <SwimCard
              key={swim.id}
              swim={swim}
              isOwner={swim.user_id === user?.id}
              onDelete={(swim) => deleteMutation.mutate(swim)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
