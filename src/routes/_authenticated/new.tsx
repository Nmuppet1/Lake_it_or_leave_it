import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { MapCanvas } from "@/components/MapCanvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SWIM_METRICS, swimsQueryKey, uploadSwimPhoto } from "@/lib/swims";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({
    meta: [
      { title: "Log a swim · Frozen Assets" },
      {
        name: "description",
        content:
          "Drop a pin where you swam, add a photo, water temperature, rating and a short review.",
      },
      { property: "og:title", content: "Log a swim · Frozen Assets" },
      {
        property: "og:description",
        content: "Pin the spot, add a photo and log the water temperature.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewSwim,
});

function NewSwim() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [spotName, setSpotName] = useState("");
  const [rating, setRating] = useState(4);
  const [swamOn, setSwamOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [review, setReview] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, number>>(() =>
    Object.fromEntries(SWIM_METRICS.map((metric) => [metric.key, 3])),
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!pin) {
      toast.error("Tap the map to drop a pin where you swam");
      return;
    }
    setBusy(true);
    try {
      const photoPath = file ? await uploadSwimPhoto(user.id, file) : null;
      const { error } = await supabase.from("swims").insert({
        user_id: user.id,
        spot_name: spotName.trim(),
        lat: pin.lat,
        lng: pin.lng,
        photo_path: photoPath,
        review: review.trim() || null,
        rating,
        swam_on: swamOn,
        ...(metrics as Record<string, number>),
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: swimsQueryKey });
      toast.success("Swim logged");
      void navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the swim :-(");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/" className="label-eyebrow hover:text-foreground">
        ← Back to swims
      </Link>
      <h1 className="mt-6 text-4xl">Log a swim</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tap on the map to drop a pin, then add some fun details.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <div className="h-72 overflow-hidden rounded-lg border border-border">
            <MapCanvas pin={pin} onPick={(lat, lng) => setPin({ lat, lng })} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
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
              placeholder="CVP- Sheffield"
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
            <Label htmlFor="photo">Photo</Label>
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
              placeholder="Easy to access, water feels thick and not very clean, great vibes in the sun however"
            />
          </div>
        </div>

        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Log swim!"}
        </Button>
      </form>
    </main>
  );
}