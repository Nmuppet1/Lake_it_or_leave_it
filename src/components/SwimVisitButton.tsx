import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { fetchVisits, toggleVisit, visitStats, visitsQueryKey } from "@/lib/visits";
import { cn } from "@/lib/utils";

export function SwimVisitButton({
  swimId,
  className,
}: {
  swimId: string;
  className?: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: visits } = useQuery({ queryKey: visitsQueryKey, queryFn: fetchVisits });
  const { count, mine } = visitStats(visits, swimId, user?.id);

  const mutation = useMutation({
    mutationFn: toggleVisit,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: visitsQueryKey }),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save that"),
  });

  return (
    <button
      type="button"
      disabled={mutation.isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!user) {
          toast.error("Sign in to say you swam here too");
          return;
        }
        mutation.mutate({ swimId, userId: user.id, visited: mine });
      }}
      className={cn(
        "relative z-10 rounded-full border px-3 py-1 text-xs transition-colors",
        mine
          ? "border-primary bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary",
        className,
      )}
      aria-pressed={mine}
    >
      {mine ? "You swam here" : "I swam here too!"}
      <span className="ml-2 text-accent">{count}</span>
    </button>
  );
}
