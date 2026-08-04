import { supabase } from "@/integrations/supabase/client";

export type SwimComment = {
  id: string;
  swim_id: string;
  user_id: string;
  body: string;
  created_at: string;
  username: string | null;
};

export const commentsQueryKey = (swimId: string) => ["swim-comments", swimId] as const;

export async function fetchComments(swimId: string): Promise<SwimComment[]> {
  const { data, error } = await supabase
    .from("swim_comments")
    .select("id, swim_id, user_id, body, created_at")
    .eq("swim_id", swimId)
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

  return rows.map((row) => ({ ...row, username: usernames.get(row.user_id) ?? null }));
}

export async function addComment(input: {
  swimId: string;
  userId: string;
  body: string;
}): Promise<void> {
  const { error } = await supabase.from("swim_comments").insert({
    swim_id: input.swimId,
    user_id: input.userId,
    body: input.body.trim(),
  });
  if (error) throw error;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from("swim_comments").delete().eq("id", commentId);
  if (error) throw error;
}
