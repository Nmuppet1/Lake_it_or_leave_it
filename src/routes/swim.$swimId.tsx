import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SwimRadar } from "@/components/SwimRadar";
import { useAuth } from "@/hooks/useAuth";
import { addComment, commentsQueryKey, deleteComment, fetchComments } from "@/lib/comments";
import { fetchSwim, swimQueryKey } from "@/lib/swims";

export const Route = createFileRoute("/swim/$swimId")({
  head: () => ({
    meta: [
      { title: "A wild swim · Frozen Assets" },
      {
        name: "description",
        content:
          "Read the review of this wild swim, see the photo and leave your own notes on the cold water.",
      },
      { property: "og:title", content: "A wild swim · Frozen Assets" },
      {
        property: "og:description",
        content: "See this wild swim and leave your own notes on the water.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SwimDetail,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p role="alert" className="text-sm text-destructive">
        {error.message}
      </p>
      <Link to="/" className="mt-4 inline-block text-sm text-primary">
        Back to the map
      </Link>
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm text-muted-foreground">This swim no longer exists :-(.</p>
    </main>
  ),
});

function SwimDetail() {
  const { swimId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const { data: swim, isLoading } = useQuery({
    queryKey: swimQueryKey(swimId),
    queryFn: () => fetchSwim(swimId),
  });

  const { data: comments } = useQuery({
    queryKey: commentsQueryKey(swimId),
    queryFn: () => fetchComments(swimId),
  });

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: commentsQueryKey(swimId) });

  const addMutation = useMutation({
    mutationFn: addComment,
    onSuccess: () => {
      setBody("");
      invalidate();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not post your comment whoops"),
  });

  const removeMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: invalidate,
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not delete the comment whoops hope you said nothing too bad"),
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="label-eyebrow">Loading swim wait a sec</p>
      </main>
    );
  }

  if (!swim) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm text-muted-foreground">This swim no longer exists.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary">
          Back to the map
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link to="/" className="label-eyebrow hover:text-foreground">
        ← BACK TO THE MAP
      </Link>

      <article className="surface-frost mt-5 overflow-hidden rounded-lg">
        {swim.photo_url ? (
          <img
            src={swim.photo_url}
            alt={`Wild swim at ${swim.spot_name}`}
            className="max-h-96 w-full object-cover"
          />
        ) : null}
        <div className="space-y-3 p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="text-3xl leading-none">{swim.spot_name}</h1>
            <span className="text-sm text-accent">{"💧".repeat(swim.rating)}</span>
          </div>
          <p className="label-eyebrow">
            {swim.swam_on} · {swim.username ?? "someone"}
          </p>
          {swim.review ? <p className="text-sm text-foreground/85">{swim.review}</p> : null}
        </div>
      </article>

      <section className="surface-frost mt-6 rounded-lg p-6">
        <h2 className="label-eyebrow">SPOT PROFILE</h2>
        <SwimRadar swim={swim} />
      </section>

      <section className="mt-10">
        <h2 className="label-eyebrow">
          {comments?.length ? `${comments.length} notes on this swim` : "No notes yet, feel free to add soemthing nice!"}
        </h2>

        {user ? (
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!body.trim()) return;
              addMutation.mutate({ swimId, userId: user.id, body });
            }}
          >
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="How was the water? Any tips from when you went?"
              rows={3}
              maxLength={1000}
            />
            <Button type="submit" size="sm" disabled={!body.trim() || addMutation.isPending}>
              {addMutation.isPending ? "Posting…" : "Post note"}
            </Button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            <Link to="/auth" className="text-primary">
              Sign in
            </Link>{" "}
            to leave a note on this swim.
          </p>
        )}

        <ul className="mt-6 space-y-4">
          {(comments ?? []).map((comment) => (
            <li key={comment.id} className="surface-frost rounded-lg p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {comment.username ?? "someone"} · {new Date(comment.created_at).toLocaleDateString()}
                </p>
                {comment.user_id === user?.id ? (
                  <button
                    type="button"
                    className="text-xs text-destructive hover:text-destructive/80"
                    onClick={() => removeMutation.mutate(comment.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-foreground/85">{comment.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
