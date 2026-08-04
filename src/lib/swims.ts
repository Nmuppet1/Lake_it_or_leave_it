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
};

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

export async function deleteSwim(swim: { id: string; photo_path: string | null }): Promise<void> {
  const { error } = await supabase.from("swims").delete().eq("id", swim.id);
  if (error) throw error;

  if (swim.photo_path) {
    const { error: storageError } = await supabase.storage.from("swim-photos").remove([swim.photo_path]);
    if (storageError) console.error("Failed to remove photo", storageError);
  }
}
