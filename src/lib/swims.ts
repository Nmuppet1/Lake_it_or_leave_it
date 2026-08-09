import { supabase } from "@/integrations/supabase/client";

export type Swim = {
  id: string;
  user_id: string;
  spot_name: string;
  lat: number;
  lng: number;
  photo_path: string | null;
  review: string | null;
  rating: number;
  swam_on: string;
  created_at: string;
  username: string | null;
  photo_url: string | null;
  jumpability: number;
  scenery: number;
  legality: number;
  privacy: number;
  accessibility: number;
  cleanliness: number;
  turbidity: number;
  parking: number;
};

export const SWIM_METRICS = [
  { key: "jumpability", label: "Jumpability" },
  { key: "scenery", label: "Scenery" },
  { key: "legality", label: "Legality" },
  { key: "privacy", label: "Privacy" },
  { key: "accessibility", label: "Access" },
  { key: "cleanliness", label: "Cleanliness" },
  { key: "turbidity", label: "Clarity" },
  { key: "parking", label: "Parking" },
] as const satisfies ReadonlyArray<{ key: keyof Swim; label: string }>;

export const swimsQueryKey = ["swims"] as const;

export async function fetchSwims(): Promise<Swim[]> {
  const { data, error } = await supabase
    .from("swims")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const usernames = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);
    for (const profile of profiles ?? []) usernames.set(profile.id, profile.username);
  }

  const paths = rows.map((row) => row.photo_path).filter((path): path is string => !!path);
  const photoUrls = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("swim-photos")
      .createSignedUrls(paths, 60 * 60);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) photoUrls.set(item.path, item.signedUrl);
    }
  }

  return rows.map((row) => ({
    ...row,
    username: usernames.get(row.user_id) ?? null,
    photo_url: row.photo_path ? photoUrls.get(row.photo_path) ?? null : null,
  }));
}

export async function uploadSwimPhoto(userId: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("swim-photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export const swimQueryKey = (swimId: string) => ["swim", swimId] as const;

export async function fetchSwim(swimId: string): Promise<Swim | null> {
  const { data, error } = await supabase.from("swims").select("*").eq("id", swimId).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", data.user_id)
    .maybeSingle();

  let photoUrl: string | null = null;
  if (data.photo_path) {
    const { data: signed } = await supabase.storage
      .from("swim-photos")
      .createSignedUrl(data.photo_path, 60 * 60);
    photoUrl = signed?.signedUrl ?? null;
  }

  return { ...data, username: profile?.username ?? null, photo_url: photoUrl };
}

export async function deleteSwim(swim: { id: string; photo_path: string | null }): Promise<void> {
  const { error } = await supabase.from("swims").delete().eq("id", swim.id);
  if (error) throw error;

  if (swim.photo_path) {
    const { error: storageError } = await supabase.storage.from("swim-photos").remove([swim.photo_path]);
    if (storageError) console.error("Failed to remove photo", storageError);
  }
}

export type SwimUpdate = {
  spot_name: string;
  lat: number;
  lng: number;
  review: string | null;
  rating: number;
  swam_on: string;
  photo_path?: string | null;
} & Partial<Record<(typeof SWIM_METRICS)[number]["key"], number>>;

export async function updateSwim(swimId: string, patch: SwimUpdate): Promise<void> {
  const { error } = await supabase.from("swims").update(patch).eq("id", swimId);
  if (error) throw error;
}

/** Most recent swim among the best rated ones from the last week (falls back to all time). */
export function pickSwimOfTheDay(swims: Swim[]): Swim | null {
  if (swims.length === 0) return null;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = swims.filter((swim) => new Date(swim.created_at).getTime() >= weekAgo);
  const pool = recent.length > 0 ? recent : swims;
  return [...pool].sort(
    (a, b) => b.rating - a.rating || b.created_at.localeCompare(a.created_at),
  )[0] ?? null;
}
