"use client";

import { useState } from "react";
import { db } from "@/lib/supabase";

export function AuthForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    if (mode === "in") {
      const { error: err } = await db().auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
    } else {
      const { data, error: err } = await db().auth.signUp({ email, password });
      if (err) setError(err.message);
      else if (!data.session) setMessage("Check your email for a confirmation link, then sign in.");
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-5">
      <div>
        <h1 className="text-3xl">
          fit<sup>3</sup>
        </h1>
        <p className="muted mt-2">
          Workouts built from the equipment your gym has. No equipment setup.
        </p>
      </div>
      <form onSubmit={submit} className="card flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="notice notice-error">{error}</p>}
        {message && <p className="notice">{message}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>
      <button
        className="btn btn-quiet"
        onClick={() => {
          setMode(mode === "in" ? "up" : "in");
          setError(null);
          setMessage(null);
        }}
      >
        {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
      </button>
    </main>
  );
}
