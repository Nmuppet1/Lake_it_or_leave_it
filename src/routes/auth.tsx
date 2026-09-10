import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Lake it or leave it" },
      {
        name: "description",
        content:
          "Sign in to Lake it or leave it to log your wild swims.",
      },
      { property: "og:title", content: "Sign in · Lake it or leave it" },
      {
        property: "og:description",
        content: "Log wild swims.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/" });
  }, [loading, session, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setAwaitingConfirm(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Oh noo something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <Link to="/" className="label-eyebrow mb-10 hover:text-foreground">
        ← Lake it or leave it
      </Link>
      <div className="surface-frost w-full max-w-sm rounded-lg p-7">
        <h1 className="text-3xl">{mode === "signin" ? "Welcome back in" : "Join the cold"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to log an awesome swim."
            : "Pick a name. It shows on your shared swims."}
        </p>

        {awaitingConfirm ? (
          <p className="mt-6 rounded-md border border-border bg-secondary p-4 text-sm">
            Check your email (it might be in junk so unjunk it) and confirm your account, then come back and sign in :-).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" ? (
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  minLength={2}
                  maxLength={24}
                  placeholder="Chilly_Jill123"
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
            {mode === "signup" ? (
              <div className="space-y-3 rounded-md border border-border bg-secondary/60 p-4">
                <p className="label-eyebrow">Before you join</p>
                <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                  <li>
                    • Your email, username and every swim you log are stored on our servers.
                  </li>
                  <li>
                    • Swims are public: the spot name, map pin, photo, review, ratings, date and
                    your username are visible to anyone visiting the site, signed in or not.
                  </li>
                  <li>
                    • Photos you upload are public too, including anything visible in them, so
                    don't upload pictures of other people without their say-so.
                  </li>
                  <li>
                    • Pins reveal a real location. Don't pin private land or anywhere that puts
                    people at risk, and only log spots you're happy for others to find.
                  </li>
                  <li>
                    • Notes you leave on other swims are public and attached to your username.
                  </li>
                  <li>
                    • Wild swimming carries real risk. Everything here is user-submitted, unchecked
                    and no promise that a spot is safe or legal — swim at your own risk.
                  </li>
                  <li>
                    • You can edit or delete your own swims any time, and deleting your account
                    removes your swims and photos.
                  </li>
                  <li>
                    • We may remove content that's unsafe, unlawful or abusive.
                  </li>
                </ul>
                <label className="flex items-start gap-2 text-xs text-foreground/85">
                  <input
                    type="checkbox"
                    required
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                  />
                  <span>I understand and agree to the above.</span>
                </label>
              </div>
            ) : null}
            <Button
              type="submit"
              className="w-full"
              disabled={busy || (mode === "signup" && !agreed)}
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogle}
              disabled={busy}
            >
              Continue with a Google login
            </Button>
          </form>
        )}

        <button
          type="button"
          className="mt-6 text-xs text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => {
            setAwaitingConfirm(false);
            setMode(mode === "signin" ? "signup" : "signin");
          }}
        >
          {mode === "signin" ? "Not cool enough for an account yet? Sign up" : "Already cool enough to have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}