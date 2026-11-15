"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/lib/app";
import { prettyDate } from "@/lib/dates";
import { EXERCISES_BY_ID } from "@/lib/exercises";
import { db } from "@/lib/supabase";
import type { JournalSet } from "@/lib/types";

interface GymName {
  id: string;
  name: string;
}

export default function JournalPage() {
  const { userId } = useApp();
  const [sets, setSets] = useState<JournalSet[] | null>(null);
  const [gyms, setGyms] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await db()
      .from("journal_sets")
      .select("*")
      .order("performed_on", { ascending: false })
      .order("id", { ascending: true })
      .limit(500);
    if (err) {
      setError(err.message);
      return;
    }
    const rows = (data as JournalSet[]) ?? [];
    setSets(rows);
    const ids = [...new Set(rows.map((row) => row.gym_id).filter((id): id is string => Boolean(id)))];
    if (ids.length) {
      const { data: names } = await db().from("gyms").select("id, name").in("id", ids);
      setGyms(Object.fromEntries(((names as GymName[] | null) ?? []).map((g) => [g.id, g.name])));
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount: the result is set asynchronously once the request returns.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (userId) load();
  }, [userId, load]);

  async function remove(id: number) {
    const { error: err } = await db().from("journal_sets").delete().eq("id", id);
    if (err) setError(err.message);
    else setSets((rows) => rows?.filter((row) => row.id !== id) ?? null);
  }

  const days: { date: string; gym: string | null; byExercise: Record<string, JournalSet[]> }[] = [];
  for (const row of sets ?? []) {
    let day = days.find((d) => d.date === row.performed_on);
    if (!day) {
      day = { date: row.performed_on, gym: row.gym_id ? (gyms[row.gym_id] ?? null) : null, byExercise: {} };
      days.push(day);
    }
    (day.byExercise[row.exercise_id] ??= []).push(row);
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1>Journal</h1>
        <p className="muted text-sm">Only you can see this.</p>
      </header>
      {error && <p className="notice notice-error">{error}</p>}
      {sets === null && !error && <p className="muted">Loading…</p>}
      {sets?.length === 0 && (
        <p className="muted">Nothing logged yet. Sets you log on the Workout tab appear here.</p>
      )}
      {days.map((day) => (
        <section key={day.date} className="card flex flex-col gap-3">
          <header>
            <h2>{prettyDate(day.date)}</h2>
            {day.gym && <p className="muted text-sm">{day.gym}</p>}
          </header>
          {Object.entries(day.byExercise).map(([exerciseId, rows]) => (
            <div key={exerciseId}>
              <p className="font-semibold">{EXERCISES_BY_ID[exerciseId]?.name ?? exerciseId}</p>
              <ul className="mt-1 flex flex-wrap gap-2 text-sm">
                {rows.map((row) => (
                  <li key={row.id} className="notice flex items-center gap-2 font-mono">
                    {EXERCISES_BY_ID[exerciseId]?.kind === "cardio"
                      ? `${row.reps} min`
                      : `${row.weight === null ? "BW" : `${Number(row.weight)} ${row.unit}`} × ${row.reps}`}
                    <button
                      className="muted"
                      aria-label="Delete this set"
                      onClick={() => remove(row.id)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
