import { Link } from "@tanstack/react-router";

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
import { SwimVisitButton } from "@/components/SwimVisitButton";
import type { Swim } from "@/lib/swims";

export function SwimCard({
  swim,
  isOwner,
  onDelete,
}: {
  swim: Swim;
  isOwner: boolean;
  onDelete: (swim: Swim) => void;
}) {
  return (
    <article className="surface-frost relative overflow-hidden rounded-lg transition-colors hover:border-primary/50">
      <Link
        to="/swim/$swimId"
        params={{ swimId: swim.id }}
        aria-label={`Open ${swim.spot_name}`}
        className="absolute inset-0 z-0"
      />
      {swim.photo_url ? (
        <img
          src={swim.photo_url}
          alt={`Wild swim at ${swim.spot_name}`}
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="space-y-2 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xl">{swim.spot_name}</h3>
          <span className="text-sm text-accent">{"💧".repeat(swim.rating)}</span>
        </div>
        <p className="label-eyebrow">{swim.swam_on}</p>
        {swim.review ? (
          <p className="line-clamp-3 text-sm text-foreground/85">{swim.review}</p>
        ) : null}
        <div className="flex items-center justify-between gap-2 pt-1">
          <SwimVisitButton swimId={swim.id} />
          <p className="text-xs text-muted-foreground">{swim.username ?? "someone"}</p>
        </div>
        {isOwner ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="relative z-10 text-xs text-destructive hover:text-destructive/80"
              >
                Delete
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this swim?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove {swim.spot_name} and its photo. This cannot be undone!
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
    </article>
  );
}
