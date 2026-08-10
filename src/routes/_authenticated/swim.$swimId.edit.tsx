import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MapCanvas } from "@/components/MapCanvas";
import { PlaceSearch } from "@/components/PlaceSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  SWIM_METRICS,
  fetchSwim,
  swimQueryKey,
  swimsQueryKey,
  updateSwim,
  uploadSwimPhoto,
} from "@/lib/swims";

export const Route = createFileRoute("/_authenticated/swim/$swimId/edit")({
  head: () => ({
    meta: [
      { title: "Edit a swim · Lake it or leave it" },
      {
        name: "description",
        content: "Change the pin, photo, rating or review of a wild swim you logged.",
      },
      { property: "og:title", content: "Edit a swim · Lake it or leave it" },
      { property: "og:description", content: "Update the details of a swim you logged." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditSwim,
});

function EditSwim() {
  const { swimId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: swim, isLoading } = useQuery({
    queryKey: swimQueryKey(swimId),
    queryFn: () => fetchSwim(swimId),
  });

  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [spotName, setSpotName] = useState("");
  const [rating, setRating] = useState(4);
  const [swamOn, setSwamOn] = useState("");
  const [review, setReview] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, number>>(() =>
    Object.fromEntries(SWIM_METRICS.map((metric) => [metric.key, 3])),
  );

  useEffect(() => {
    if (!swim) return;
    setPin({ lat: swim.lat, lng: swim.lng });
    setFlyTo({ lat: swim.lat, lng: swim.lng });
    setSpotName(swim.spot_name);
    setRating(swim.rating);
    setSwamOn(swim.swam_on);
    setReview(swim.review ?? "");
    setMetrics(
      Object.fromEntries(
        SWIM_METRICS.map((metric) => [metric.key, Number(swim[metric.key] ?? 3)]),
      ),
    );
  }, [swim]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="label-eyebrow">Loading swim…</p>
      </main>
    );
  }

  if (!swim) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-muted-foreground">This swim no longer exists.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary">
          Back to the map
        </Link>
      </main>
    );
  }

  if (swim.user_id !== user?.id) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-muted-foreground">You can only edit your own swims.</p>
        <Link
          to="/swim/$swimId"
          params={{ swimId }}
          className="mt-4 inline-block text-sm text-primary"
        >
          Back to this swim
        </Link>
      </main>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!swim || !user) return;
    if (!pin) {
      toast.error("Tap the map to drop a pin where you swam");
      return;
    }
    setBusy(true);
    try {
      const photoPath = file ? await uploadSwimPhoto(user.id, file) : undefined;
      await updateSwim(swim.id, {
        spot_name: spotName.trim(),
        lat: pin.lat,
        lng: pin.lng,
        review: review.trim() || null,
        rating,
        swam_on: swamOn,
        ...(photoPath ? { photo_path: photoPath } : {}),
        ...(metrics as Record<string, number>),
      });
      await queryClient.invalidateQueries({ queryKey: swimsQueryKey });
      await queryClient.invalidateQueries({ queryKey: swimQueryKey(swim.id) });
      toast.success("Swim updated");
      void navigate({ to: "/swim/$swimId", params: { swimId: swim.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the swim :-(");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link
        to="/swim/$swimId"
        params={{ swimId }}
        className="label-eyebrow hover:text-foreground"
      >
        ← Back to this swim
      </Link>
      <h1 className="mt-6 text-4xl">Edit swim</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Move the pin, change the details or swap the photo.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-3">
          <PlaceSearch
            onPick={(place) => setFlyTo({ lat: place.lat, lng: place.lng, zoom: 14 })}
          />
          <div className="h-72 overflow-hidden rounded-lg border border-border">
            <MapCanvas
              pin={pin}
              flyTo={flyTo}
              onPick={(lat, lng) => setPin({ lat, lng })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {pin
              ? `Pinned at ${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`
              : "No pin yet, so please tap the map."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="spot">Spot name</Label>
            <Input
              id="spot"
              value={spotName}
              onChange={(event) => setSpotName(event.target.value)}
              required
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={swamOn}
              onChange={(event) => setSwamOn(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Rating</Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} star${value > 1 ? "s" : ""}`}
                  onClick={() => setRating(value)}
                  className={
                    value <= rating
                      ? "text-2xl leading-none text-accent"
                      : "text-2xl leading-none text-muted-foreground/50"
                  }
                >
                  💧
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="photo">Replace photo</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="review">Review</Label>
            <Textarea
              id="review"
              value={review}
              onChange={(event) => setReview(event.target.value)}
              rows={4}
              maxLength={600}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Spot profile (each out of 5)</Label>
          <div className="grid gap-5 sm:grid-cols-2">
            {SWIM_METRICS.map((metric) => (
              <div key={metric.key} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-foreground/85">{metric.label}</span>
                  <span className="text-sm text-accent">{metrics[metric.key]}</span>
                </div>
                <Slider
                  aria-label={metric.label}
                  min={1}
                  max={5}
                  step={1}
                  value={[metrics[metric.key] ?? 3]}
                  onValueChange={(values) =>
                    setMetrics((previous) => ({ ...previous, [metric.key]: values[0] ?? 3 }))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </main>
  );
}
