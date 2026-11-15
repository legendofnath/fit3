"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExerciseCard } from "@/components/ExerciseCard";
import { useApp } from "@/lib/app";
import { EQUIPMENT_BY_ID } from "@/lib/catalog";
import { isoDate, weekStart } from "@/lib/dates";
import { EXERCISES_BY_ID } from "@/lib/exercises";
import {
  estimateMinutes,
  findSubstitute,
  generateWeek,
  repairPlan,
  validatePlan,
} from "@/lib/generator";
import { computeHistory } from "@/lib/journal";
import { db } from "@/lib/supabase";
import type { JournalSet, LastResult, WeekPlan } from "@/lib/types";

const CACHE_KEY = "fit3.plan";

/** Current time in milliseconds. Kept outside the component so handlers stay pure to the linter. */
const clock = () => Date.now();

function readCache(key: string): WeekPlan | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { key: string; plan: WeekPlan };
    return parsed.key === key ? parsed.plan : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, plan: WeekPlan) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ key, plan }));
  } catch {
    // Storage can be unavailable; the plan is still saved to the account.
  }
}

export default function WorkoutPage() {
  const { userId, profile, gym, available, refresh } = useApp();
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [history, setHistory] = useState<Record<string, LastResult>>({});
  const [today, setToday] = useState<JournalSet[]>([]);
  const [dayIndex, setDayIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restEnds, setRestEnds] = useState<number | null>(null);
  const [now, setNow] = useState(clock);

  const week = weekStart();
  const cacheKey = `${userId}:${gym?.id}:${week}`;

  const save = useCallback(
    async (next: WeekPlan) => {
      setPlan(next);
      writeCache(cacheKey, next);
      const { error: err } = await db()
        .from("plans")
        .upsert({ user_id: userId, week_start: week, gym_id: gym?.id, data: next, updated_at: new Date().toISOString() });
      if (err) setError(`Could not save the plan: ${err.message}`);
    },
    [cacheKey, gym?.id, userId, week],
  );

  // Load this week's plan, or build one. Runs again when the gym or profile changes.
  useEffect(() => {
    if (!userId || !profile || !gym) return;
    let active = true;
    (async () => {
      const [planRes, setsRes] = await Promise.all([
        db().from("plans").select("gym_id, data").eq("user_id", userId).eq("week_start", week).maybeSingle(),
        db()
          .from("journal_sets")
          .select("*")
          .order("performed_on", { ascending: false })
          .order("id", { ascending: true })
          .limit(800),
      ]);
      if (!active) return;

      if (planRes.error || setsRes.error) {
        // Offline or the request failed: fall back to the copy saved on this device.
        const cached = readCache(cacheKey);
        if (cached) {
          setPlan(cached);
          setNotice("Showing the copy saved on this device. Sets you log now may not be saved.");
        } else {
          setError("Could not load your workout. Check your connection and reload.");
        }
        return;
      }

      const sets = (setsRes.data as JournalSet[]) ?? [];
      const hist = computeHistory(sets);
      setHistory(hist);
      setToday(sets.filter((row) => row.performed_on === isoDate()));

      const stored = planRes.data;
      if (stored && stored.gym_id === gym.id) {
        const existing = stored.data as WeekPlan;
        if (validatePlan(existing, available).length === 0) {
          setPlan(existing);
          writeCache(cacheKey, existing);
        } else {
          setNotice("Your gym's equipment changed, so some exercises were replaced.");
          await save(repairPlan(existing, available, profile, hist, `${userId}${week}`));
        }
      } else {
        await save(generateWeek(profile, available, hist, `${userId}${week}`));
      }
    })();
    return () => {
      active = false;
    };
    // `available` changes identity on every equipment refresh; the plan is re-checked then.
  }, [userId, profile, gym, available, week, cacheKey, save]);

  useEffect(() => {
    if (restEnds === null) return;
    const timer = setInterval(() => setNow(clock()), 500);
    return () => clearInterval(timer);
  }, [restEnds]);

  const day = plan?.days[Math.min(dayIndex, (plan?.days.length ?? 1) - 1)];
  const loggedByExercise = useMemo(() => {
    const map: Record<string, JournalSet[]> = {};
    for (const row of today) (map[row.exercise_id] ??= []).push(row);
    return map;
  }, [today]);

  if (!profile || !gym) return null;
  const restLeft = restEnds === null ? 0 : Math.max(0, Math.ceil((restEnds - now) / 1000));

  async function regenerate() {
    if (!profile) return;
    setBusy(true);
    setNotice(null);
    await save(generateWeek(profile, available, history, `${userId}${week}${clock()}`));
    setBusy(false);
  }

  async function logSet(exerciseId: string, weight: number | null, reps: number) {
    if (!plan || !day || !gym || !profile) return;
    const item = day.exercises.find((it) => it.exercise_id === exerciseId);
    if (!item) return;
    setBusy(true);
    setError(null);
    const { data, error: err } = await db()
      .from("journal_sets")
      .insert({
        gym_id: gym.id,
        exercise_id: exerciseId,
        performed_on: isoDate(),
        set_number: Math.min(20, (loggedByExercise[exerciseId]?.length ?? 0) + 1),
        reps,
        weight,
        unit: profile.units,
        target_reps_high: item.reps ? item.reps[1] : null,
      })
      .select()
      .single();
    setBusy(false);
    if (err) {
      setError(`Set not saved: ${err.message}`);
      return;
    }
    setToday((rows) => [...rows, data as JournalSet]);
    if (item.rest_seconds > 0) {
      const started = clock();
      setNow(started);
      setRestEnds(started + item.rest_seconds * 1000);
    }
  }

  async function swap(exerciseId: string, without: Set<string>, message: string) {
    if (!plan || !day || !profile) return;
    const sub = findSubstitute(day, exerciseId, without, profile, history, String(clock()));
    if (!sub) {
      setNotice("Nothing else here trains that muscle with what is free right now. Skip it for today.");
      return;
    }
    const index = plan.days.indexOf(day);
    const next: WeekPlan = {
      ...plan,
      days: plan.days.map((d, i) =>
        i === index
          ? { ...d, exercises: d.exercises.map((it) => (it.exercise_id === exerciseId ? sub : it)) }
          : d,
      ),
    };
    setNotice(message.replace("%s", EXERCISES_BY_ID[sub.exercise_id].name));
    await save(next);
  }

  async function taken(exerciseId: string) {
    setBusy(true);
    const without = new Set(available);
    for (const item of EXERCISES_BY_ID[exerciseId].requires) without.delete(item);
    await swap(exerciseId, without, "Swapped to %s for today.");
    setBusy(false);
  }

  async function missing(exerciseId: string, equipmentId: string) {
    if (!gym) return;
    setBusy(true);
    setError(null);
    const { error: err } = await db().rpc("change_gym_equipment", {
      p_gym: gym.id,
      p_equipment: equipmentId,
      p_action: "remove",
    });
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    const without = new Set(available);
    without.delete(equipmentId);
    const name = EQUIPMENT_BY_ID[equipmentId]?.name ?? equipmentId;
    await swap(exerciseId, without, `Removed ${name} from this gym for everyone. Swapped to %s.`);
    // Reloading equipment re-checks the rest of the week against the updated list.
    await refresh();
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="muted text-sm">{gym.name}</p>
        <h1>This week</h1>
      </header>

      {error && <p className="notice notice-error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      {!plan || !day ? (
        <p className="muted">Building your week…</p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Days">
            {plan.days.map((d, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={d === day}
                className="btn btn-small shrink-0"
                style={d === day ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
                onClick={() => setDayIndex(i)}
              >
                Day {i + 1}
              </button>
            ))}
          </div>

          <div>
            <h2>{day.focus}</h2>
            <p className="muted text-sm">
              About {estimateMinutes(day)} minutes, including a 5 minute warm-up of light cardio and
              easy sets of your first exercise.
            </p>
          </div>

          {day.exercises.length === 0 && (
            <p className="notice">
              Nothing fits this day with your gym&apos;s equipment and your settings. Add equipment
              on the Gym tab or change your profile.
            </p>
          )}

          {day.exercises.map((item) => (
            <ExerciseCard
              key={item.exercise_id}
              item={item}
              exercise={EXERCISES_BY_ID[item.exercise_id]}
              logged={loggedByExercise[item.exercise_id] ?? []}
              units={profile.units}
              busy={busy}
              onLog={(weight, reps) => logSet(item.exercise_id, weight, reps)}
              onTaken={() => taken(item.exercise_id)}
              onMissing={(equipmentId) => missing(item.exercise_id, equipmentId)}
            />
          ))}

          <button className="btn" disabled={busy} onClick={regenerate}>
            Build a different week
          </button>
        </>
      )}

      {restLeft > 0 && (
        <div
          className="fixed inset-x-0 bottom-16 mx-auto flex max-w-xl items-center justify-between px-5"
          role="timer"
        >
          <div className="card flex w-full items-center justify-between">
            <span className="font-semibold">Rest</span>
            <span className="font-mono text-lg">{restLeft}s</span>
            <button className="btn btn-small" onClick={() => setRestEnds(null)}>
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
