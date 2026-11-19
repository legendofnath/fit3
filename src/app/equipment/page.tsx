"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORY_COLOR, EquipmentArt } from "@/components/EquipmentArt";
import { CATEGORIES, EQUIPMENT, EQUIPMENT_BY_ID } from "@/lib/catalog";
import { EXERCISES } from "@/lib/exercises";
import type { EquipmentSource } from "@/lib/gyms";
import { currentGym, gymEquipment, toggleEquipment, useStore } from "@/lib/store";
import type { EquipmentCategory, Muscle } from "@/lib/types";

const SOURCE_LABEL: Record<EquipmentSource, string> = {
  seen: "Seen in this gym's photos",
  typical: "Typical for this kind of gym",
  added: "Added by you",
};

const MUSCLE_NAME: Record<Muscle, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  core: "Core",
  cardio: "Cardio",
};

/** What each piece of equipment unlocks, computed from the exercise library. */
function statsFor(id: string) {
  const uses = EXERCISES.filter((ex) => ex.requires.includes(id));
  const muscles = [...new Set(uses.map((ex) => ex.muscle))];
  const beginner = uses.filter((ex) => ex.difficulty === 1).length;
  return { uses, muscles, beginner };
}

const MOST_EXERCISES = Math.max(...EQUIPMENT.map((e) => statsFor(e.id).uses.length));

export default function EquipmentPage() {
  const state = useStore();
  const gym = state.hydrated ? currentGym(state) : null;
  const [scope, setScope] = useState<"gym" | "all">("gym");
  const [category, setCategory] = useState<EquipmentCategory | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const list = useMemo(() => (gym ? gymEquipment(state, gym) : []), [state, gym]);
  const atGym = useMemo(() => new Map(list.map((item) => [item.id, item.source])), [list]);

  if (!state.hydrated) return null;
  if (!gym) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="display">Pick a gym first</h1>
        <p className="lede">The equipment screen shows what your gym has.</p>
        <Link href="/gym" className="btn btn-go">
          Pick my gym
        </Link>
      </div>
    );
  }

  const pool = (scope === "gym" ? list.map((item) => EQUIPMENT_BY_ID[item.id]) : EQUIPMENT).filter(Boolean);
  const shown = pool.filter((item) => category === "all" || item.category === category);
  const activeId = selected && pool.some((p) => p.id === selected) ? selected : shown[0]?.id;
  const active = activeId ? EQUIPMENT_BY_ID[activeId] : null;
  const stats = active ? statsFor(active.id) : null;
  const source = active ? atGym.get(active.id) : undefined;
  const present = source !== undefined;
  const color = active ? CATEGORY_COLOR[active.category] : "var(--plate-yellow)";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="display">Equipment</h1>
          <p className="lede">
            {gym.name} · {list.length} items. Tap any piece to see what it unlocks.
          </p>
        </div>
        <div className="choices" role="radiogroup" aria-label="Show">
          {(
            [
              ["gym", "At my gym"],
              ["all", "Everything"],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className="choice">
              <input type="radio" name="scope" checked={scope === id} onChange={() => setScope(id)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* The stage: a large preview of the selected piece and what it unlocks. */}
        {active && stats && (
          <section
            className="stage order-2 flex flex-col gap-5 p-5 sm:p-7 lg:order-1 lg:sticky lg:top-4 lg:self-start"
            style={{ "--stage-glow": color } as React.CSSProperties}
            aria-live="polite"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="tag">
                <span className="tag-dot" style={{ color }} />
                {active.category}
              </span>
              <span className="tag" style={present ? undefined : { color: "var(--slate)" }}>
                {source ? SOURCE_LABEL[source] : "Not at this gym"}
              </span>
            </div>

            <EquipmentArt key={active.id} id={active.id} className="stage-art stage-enter" title={active.name} />

            <h2 className="display">{active.name}</h2>

            <dl className="grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="small muted">Exercises</dt>
                <dd className="num text-3xl">{stats.uses.length}</dd>
                <div className="meter" aria-hidden>
                  <span style={{ width: `${(stats.uses.length / MOST_EXERCISES) * 100}%`, "--meter-color": color } as React.CSSProperties} />
                </div>
              </div>
              <div>
                <dt className="small muted">Muscle groups</dt>
                <dd className="num text-3xl">{stats.muscles.length}</dd>
                <div className="meter" aria-hidden>
                  <span style={{ width: `${(stats.muscles.length / 11) * 100}%`, "--meter-color": color } as React.CSSProperties} />
                </div>
              </div>
              <div>
                <dt className="small muted">Beginner friendly</dt>
                <dd className="num text-3xl">
                  {stats.uses.length ? Math.round((stats.beginner / stats.uses.length) * 100) : 0}%
                </dd>
                <div className="meter" aria-hidden>
                  <span
                    style={{
                      width: `${stats.uses.length ? (stats.beginner / stats.uses.length) * 100 : 0}%`,
                      "--meter-color": color,
                    } as React.CSSProperties}
                  />
                </div>
              </div>
            </dl>

            {stats.uses.length > 0 ? (
              <div className="flex flex-col gap-2">
                <h3>Trains</h3>
                <ul className="flex flex-wrap gap-2">
                  {stats.muscles.map((m) => (
                    <li key={m} className="tag">
                      {MUSCLE_NAME[m]}
                    </li>
                  ))}
                </ul>
                <h3 className="mt-2">Unlocks</h3>
                <ul className="small grid gap-x-4 gap-y-1 sm:grid-cols-2">
                  {stats.uses.map((ex) => (
                    <li key={ex.id}>{ex.name}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="muted small">No workouts use this yet. It still shows members what the gym offers.</p>
            )}

            <div className="flex flex-wrap gap-3">
              {present ? (
                <button className="btn" onClick={() => toggleEquipment(gym.id, active.id, false)}>
                  Not at my gym
                </button>
              ) : (
                <button className="btn btn-go" onClick={() => toggleEquipment(gym.id, active.id, true)}>
                  My gym has this
                </button>
              )}
            </div>
          </section>
        )}

        {/* The roster: every piece, coloured by category. */}
        <section className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
          <div className="choices rail lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0" role="radiogroup" aria-label="Category">
            {(["all", ...CATEGORIES] as const).map((c) => {
              const count = c === "all" ? pool.length : pool.filter((p) => p.category === c).length;
              if (!count) return null;
              return (
                <label key={c} className="choice">
                  <input type="radio" name="category" checked={category === c} onChange={() => setCategory(c)} />
                  <span className="gap-2">
                    {c !== "all" && <span className="tag-dot" style={{ color: CATEGORY_COLOR[c] }} />}
                    {c === "all" ? "All" : c}
                  </span>
                </label>
              );
            })}
          </div>

          <ul className="rail lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
            {shown.map((item) => {
              const here = atGym.has(item.id);
              return (
                <li key={item.id} className="w-28 sm:w-32 lg:w-auto">
                  <button
                    className={`slot h-full w-full ${here ? "" : "slot-out"}`}
                    style={{ "--slot-color": CATEGORY_COLOR[item.category] } as React.CSSProperties}
                    aria-pressed={item.id === activeId}
                    onClick={() => setSelected(item.id)}
                  >
                    <EquipmentArt id={item.id} className="w-full" />
                    <span className="small leading-tight font-medium">{item.name}</span>
                    {!here && <span className="sr-only">(not at this gym)</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {shown.length === 0 && (
            <p className="muted">Nothing here yet. Switch to Everything to add equipment your gym has.</p>
          )}
        </section>
      </div>
    </div>
  );
}
