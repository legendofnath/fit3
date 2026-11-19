"use client";

import { MUSCLE_NAME } from "./ExerciseSheet";
import type { Muscle } from "@/lib/types";

const MUSCLES: Muscle[] = ["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "core"];

/**
 * Hard sets per muscle over the last 7 days, against the goal's weekly range.
 * One series in one hue; the target range is a recessive band behind the bars.
 */
export function MuscleSetsChart({
  sets,
  target,
}: {
  sets: Record<Muscle, number>;
  target: [number, number];
}) {
  const max = Math.max(target[1] + 4, ...MUSCLES.map((m) => sets[m]));
  const pct = (v: number) => `${(v / max) * 100}%`;
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="muted small">
        Hard sets in the last 7 days. The shaded band is {target[0]} to {target[1]} sets, the usual weekly range for your goal.
      </figcaption>
      <ul className="flex flex-col gap-1.5" aria-hidden>
        {MUSCLES.map((m) => {
          const v = Math.round(sets[m] * 10) / 10;
          const status = v === 0 ? "none" : v < target[0] ? "below" : v > target[1] ? "above" : "in";
          return (
            <li key={m} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3" title={`${MUSCLE_NAME[m]}: ${v} sets`}>
              <span className="small">{MUSCLE_NAME[m]}</span>
              <span className="relative h-5 rounded-[4px]" style={{ background: "var(--steel-2)" }}>
                <span
                  className="absolute inset-y-0 rounded-[4px]"
                  style={{ left: pct(target[0]), width: pct(target[1] - target[0]), background: "rgba(236,238,232,0.09)" }}
                />
                <span
                  className="absolute inset-y-1 left-0 rounded-r-[4px]"
                  style={{
                    width: pct(v),
                    minWidth: v > 0 ? 3 : 0,
                    background: status === "in" ? "var(--plate-yellow)" : "color-mix(in srgb, var(--plate-yellow) 55%, var(--steel-2))",
                  }}
                />
              </span>
              <span className="num text-right text-lg">{v}</span>
            </li>
          );
        })}
      </ul>
      <table className="sr-only">
        <caption>Hard sets per muscle, last 7 days</caption>
        <tbody>
          {MUSCLES.map((m) => (
            <tr key={m}>
              <th>{MUSCLE_NAME[m]}</th>
              <td>{Math.round(sets[m] * 10) / 10}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Weight moved per workout, oldest to newest. */
export function VolumeChart({
  points,
  unit,
}: {
  points: { label: string; value: number; title: string }[];
  unit: string;
}) {
  if (!points.length) return null;
  const max = Math.max(...points.map((p) => p.value), 1);
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="muted small">Weight moved per workout ({unit}), last {points.length} workouts</figcaption>
      <div className="flex h-40 items-end gap-1.5 border-b" style={{ borderColor: "var(--edge)" }} aria-hidden>
        {points.map((p, i) => (
          <div key={i} className="group relative flex h-full flex-1 flex-col justify-end" title={`${p.title}: ${p.value.toLocaleString()} ${unit}`}>
            <span
              className="block w-full rounded-t-[4px]"
              style={{ height: `${Math.max(2, (p.value / max) * 100)}%`, background: "var(--plate-yellow)" }}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-0.5 text-xs group-hover:block" style={{ background: "var(--chalk)", color: "var(--iron)" }}>
              {p.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {points.map((p, i) => (
          <span key={i} className="muted flex-1 truncate text-center text-xs">
            {p.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Weight moved per workout</caption>
        <tbody>
          {points.map((p, i) => (
            <tr key={i}>
              <th>{p.title}</th>
              <td>
                {p.value} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
