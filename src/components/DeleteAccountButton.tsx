import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

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
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";

export function DeleteAccountButton({ className = "" }: { className?: string }) {
  const deleteAccount = useServerFn(deleteMyAccount);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className={`text-xs text-destructive hover:text-destructive/80 ${className}`}
        >
          Delete account
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes your account, your swims, their photos, your notes and
            visits. This cannot be undone!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await deleteAccount({ data: undefined });
                await supabase.auth.signOut();
                toast.success("Your account has been deleted");
                void navigate({ to: "/" });
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Could not delete your account",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Deleting…" : "Delete forever"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
