import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: swims } = await supabaseAdmin
      .from("swims")
      .select("photo_path")
      .eq("user_id", userId);
    const paths = (swims ?? [])
      .map((row) => row.photo_path)
      .filter((path): path is string => !!path);
    if (paths.length > 0) {
      await supabaseAdmin.storage.from("swim-photos").remove(paths);
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
