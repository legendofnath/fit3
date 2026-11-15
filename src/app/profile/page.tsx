"use client";

import { useState } from "react";
import { ProfileForm } from "@/components/ProfileForm";
import { useApp } from "@/lib/app";
import { db } from "@/lib/supabase";

type ReportKind = "bug" | "exercise" | "equipment" | "other";

export default function ProfilePage() {
  const { email, gym } = useApp();
  const [saved, setSaved] = useState(false);
  const [kind, setKind] = useState<ReportKind>("bug");
  const [message, setMessage] = useState("");
  const [reportState, setReportState] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function report(event: React.FormEvent) {
    event.preventDefault();
    setReportState(null);
    const { error: err } = await db()
      .from("problem_reports")
      .insert({ kind, message, context: { gym_id: gym?.id ?? null } });
    if (err) setReportState(`Not sent: ${err.message}`);
    else {
      setReportState("Sent. Thank you.");
      setMessage("");
    }
  }

  async function deleteAccount() {
    setError(null);
    const { error: err } = await db().rpc("delete_my_account");
    if (err) {
      setError(err.message);
      return;
    }
    await db().auth.signOut();
    try {
      localStorage.removeItem("fit3.plan");
    } catch {
      // Nothing to clear.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1>Profile</h1>
        <p className="muted text-sm">{email}</p>
      </header>

      <section>
        <ProfileForm onSaved={() => setSaved(true)} />
        {saved && (
          <p className="notice mt-3">
            Saved. Tap “Build a different week” on the Workout tab to apply it to this week.
          </p>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3">Something&apos;s wrong</h2>
        <form onSubmit={report} className="flex flex-col gap-3">
          <select
            className="input"
            aria-label="What kind of problem"
            value={kind}
            onChange={(e) => setKind(e.target.value as ReportKind)}
          >
            <option value="bug">The app is not working right</option>
            <option value="exercise">A workout or exercise is wrong</option>
            <option value="equipment">A gym&apos;s equipment is wrong</option>
            <option value="other">Something else</option>
          </select>
          <textarea
            className="input py-2"
            style={{ minHeight: "6rem" }}
            aria-label="Describe the problem"
            placeholder="What happened?"
            required
            minLength={3}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {reportState && <p className="notice">{reportState}</p>}
          <button className="btn">Send report</button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <button className="btn" onClick={() => db().auth.signOut()}>
          Sign out
        </button>
        <details className="card">
          <summary className="cursor-pointer font-semibold">Delete my account</summary>
          <p className="muted mt-2 text-sm">
            This permanently deletes your profile, plans, journal and any private gym. Equipment
            edits you made to shared gyms stay, without your name. Type DELETE to confirm.
          </p>
          <input
            className="input mt-3"
            aria-label="Type DELETE to confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && <p className="notice notice-error mt-3">{error}</p>}
          <button
            className="btn mt-3"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
            disabled={confirm !== "DELETE"}
            onClick={deleteAccount}
          >
            Delete everything
          </button>
        </details>
      </section>
    </div>
  );
}
