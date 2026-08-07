import { supabase } from "@/integrations/supabase/client";

export type SwimVisit = { swim_id: string; user_id: string };

export const visitsQueryKey = ["swim-visits"] as const;

export async function fetchVisits(): Promise<SwimVisit[]> {
  const { data, error } = await supabase.from("swim_visits").select("swim_id, user_id");
  if (error) throw error;
  return data ?? [];
}

export function visitStats(visits: SwimVisit[] | undefined, swimId: string, userId?: string) {
  const rows = (visits ?? []).filter((visit) => visit.swim_id === swimId);
  return {
    count: rows.length,
    mine: !!userId && rows.some((visit) => visit.user_id === userId),
  };
}

export async function toggleVisit(input: {
  swimId: string;
  userId: string;
  visited: boolean;
}): Promise<void> {
  if (input.visited) {
    const { error } = await supabase
      .from("swim_visits")
      .delete()
      .eq("swim_id", input.swimId)
      .eq("user_id", input.userId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("swim_visits")
    .insert({ swim_id: input.swimId, user_id: input.userId });
  if (error) throw error;
}
