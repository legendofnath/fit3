"use client";

import Link from "next/link";
import { useState } from "react";
import { VolumeChart } from "@/components/Charts";
import { ExerciseSheet } from "@/components/ExerciseSheet";
import { EXERCISES_BY_ID } from "@/lib/exercises";
import { computeStats, lastResults, setCount, workoutVolume } from "@/lib/history";
import { update, useStore } from "@/lib/store";

const clock = () => Date.now();

function prettyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function HistoryPage() {
  const state = useStore();
  // Rendered only in the browser, where the clock and saved history exist.
  return state.hydrated ? <History /> : null;
}

function History() {
  const state = useStore();
  const [now] = useState(clock);
  const [open, setOpen] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);

  const units = state.prefs?.units ?? "lb";
  const logs = [...state.log].sort((a, b) => b.finished_at - a.finished_at);
  const stats = computeStats(logs, units, now);
  const history = lastResults(logs);
  const points = logs
    .slice(0, 12)
    .reverse()
    .map((l) => ({ label: prettyDate(l.date).split(",")[1]?.trim() ?? l.date, value: workoutVolume(l, units), title: `${prettyDate(l.date)}, ${l.focus}` }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="display">History</h1>
        <p className="lede">Every workout you finish. Saved on this device for now.</p>
      </div>

      {logs.length === 0 ? (
        <div className="panel flex flex-col items-start gap-3">
          <h2 className="display">Nothing logged yet</h2>
          <p className="lede">Build a workout, tick each set as you go, then finish it. It will appear here.</p>
          <Link href="/dashboard" className="btn btn-go">
            Go to workout
          </Link>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Last 30 days">
            {[
              { label: "Gym days, 30 days", value: stats.daysLast30 },
              { label: "Sets, 30 days", value: stats.setsLast30 },
              { label: "Hours trained, 30 days", value: Math.round((stats.minutesLast30 / 60) * 10) / 10 },
              { label: `Weight moved, 30 days (${units})`, value: stats.volumeLast30.toLocaleString() },
            ].map((s) => (
              <div key={s.label} className="panel p-4">
                <p className="num text-3xl">{s.value}</p>
                <p className="muted small leading-tight">{s.label}</p>
              </div>
            ))}
          </section>

          {points.length > 1 && (
            <section className="panel">
              <VolumeChart points={points} unit={units} />
            </section>
          )}

          <ol className="flex flex-col gap-2">
            {logs.map((log) => {
              const expanded = open === log.id;
              const minutes = Math.round((log.finished_at - log.started_at) / 60000);
              return (
                <li key={log.id} className="panel flex flex-col gap-3 p-4">
                  <button
                    className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : log.id)}
                  >
                    <span>
                      <span className="block font-semibold">
                        {prettyDate(log.date)} · {log.focus}
                      </span>
                      <span className="muted small">{log.gym_name}</span>
                    </span>
                    <span className="flex gap-5 text-right">
                      <span>
                        <span className="num block text-xl">{setCount(log)}</span>
                        <span className="muted text-xs">sets</span>
                      </span>
                      <span>
                        <span className="num block text-xl">{minutes}</span>
                        <span className="muted text-xs">min</span>
                      </span>
                      <span>
                        <span className="num block text-xl">{workoutVolume(log, units).toLocaleString()}</span>
                        <span className="muted text-xs">{units} moved</span>
                      </span>
                    </span>
                  </button>

                  {expanded && (
                    <div className="flex flex-col gap-3">
                      <ul className="flex flex-col gap-2">
                        {log.exercises.map((ex) => (
                          <li key={ex.exercise_id} className="well flex flex-col gap-1">
                            <button className="text-left font-semibold underline decoration-[var(--edge)] underline-offset-4" onClick={() => setSheet(ex.exercise_id)}>
                              {EXERCISES_BY_ID[ex.exercise_id]?.name ?? ex.exercise_id}
                            </button>
                            <p className="muted small">
                              {ex.minutes
                                ? `${ex.sets[0]?.reps ?? ex.minutes} minutes`
                                : ex.sets.map((s) => `${s.weight ?? "BW"}×${s.reps}`).join(", ")}
                            </p>
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap items-center gap-3">
                        {log.kcal !== null && <span className="muted small">About {log.kcal} kcal</span>}
                        {confirming === log.id ? (
                          <>
                            <span className="small">Delete this workout?</span>
                            <button
                              className="btn btn-sm"
                              style={{ borderColor: "var(--plate-red)", color: "var(--plate-red)" }}
                              onClick={() => {
                                update((s) => ({ log: s.log.filter((l) => l.id !== log.id) }));
                                setConfirming(null);
                              }}
                            >
                              Delete
                            </button>
                            <button className="btn btn-sm" onClick={() => setConfirming(null)}>
                              Keep
                            </button>
                          </>
                        ) : (
                          <button className="btn btn-sm ml-auto" onClick={() => setConfirming(log.id)}>
                            Delete workout
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}

      {sheet && <ExerciseSheet exerciseId={sheet} last={history[sheet]} units={units} onClose={() => setSheet(null)} />}
    </div>
  );
}
