"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  cmToFtIn,
  currentGym,
  ftInToCm,
  kgToLb,
  lbToKg,
  update,
  useStore,
  type Body,
  type Preferences,
} from "@/lib/store";
import type { AvoidTag, Goal, Units } from "@/lib/types";

const GOALS: { id: Goal; name: string; detail: string }[] = [
  { id: "strength", name: "Strength", detail: "Lift heavier. 4 to 6 reps, longer rest." },
  { id: "bodybuilding", name: "Build muscle", detail: "Size and shape. 8 to 15 reps." },
  { id: "power", name: "Power", detail: "Your heaviest lifts. 2 to 5 reps." },
  { id: "weight_loss", name: "Lose weight", detail: "Higher reps, short rest, cardio to finish." },
];

const AVOID: { id: AvoidTag; name: string }[] = [
  { id: "overhead", name: "Pressing overhead" },
  { id: "spinal_load", name: "Heavy load on my back" },
  { id: "deep_knee", name: "Deep knee bends" },
  { id: "jumping", name: "Jumping" },
];

function toNumber(value: string): number | null {
  const n = Number(value);
  return value.trim() === "" || !Number.isFinite(n) || n <= 0 ? null : n;
}

export default function SetupPage() {
  const state = useStore();
  if (!state.hydrated) return null;
  // Keyed so the form starts from saved values once the browser state is read.
  return <SetupForm key="setup" />;
}

function SetupForm() {
  const state = useStore();
  const router = useRouter();
  const editing = Boolean(state.body && state.prefs);
  const [step, setStep] = useState<1 | 2>(1);

  const savedBody = state.body;
  const savedPrefs = state.prefs;
  const [units, setUnits] = useState<Units>(savedPrefs?.units ?? "lb");
  const [age, setAge] = useState(savedBody?.age ? String(savedBody.age) : "");
  const [sex, setSex] = useState<Body["sex"]>(savedBody?.sex ?? "unspecified");
  const ftIn = savedBody?.height_cm ? cmToFtIn(savedBody.height_cm) : null;
  const [heightFt, setHeightFt] = useState(ftIn ? String(ftIn.ft) : "");
  const [heightIn, setHeightIn] = useState(ftIn ? String(ftIn.in) : "");
  const [heightCm, setHeightCm] = useState(savedBody?.height_cm ? String(Math.round(savedBody.height_cm)) : "");
  const [weight, setWeight] = useState(
    savedBody?.weight_kg
      ? String(units === "lb" ? kgToLb(savedBody.weight_kg) : Math.round(savedBody.weight_kg))
      : "",
  );

  const [goal, setGoal] = useState<Goal>(savedPrefs?.goal ?? "strength");
  const [experience, setExperience] = useState<1 | 2 | 3>(savedPrefs?.experience ?? 1);
  const [days, setDays] = useState(savedPrefs?.days_per_week ?? 3);
  const [minutes, setMinutes] = useState(savedPrefs?.session_minutes ?? 60);
  const [avoid, setAvoid] = useState<AvoidTag[]>(savedPrefs?.avoid ?? []);
  const [agreed, setAgreed] = useState(editing);

  function bodyFromForm(): Body {
    const w = toNumber(weight);
    const height =
      units === "lb"
        ? toNumber(heightFt) !== null
          ? ftInToCm(Number(heightFt), Number(heightIn) || 0)
          : null
        : toNumber(heightCm);
    return {
      age: toNumber(age),
      sex,
      height_cm: height,
      weight_kg: w === null ? null : units === "lb" ? lbToKg(w) : w,
    };
  }

  function finish(event: React.FormEvent) {
    event.preventDefault();
    const prefs: Preferences = {
      goal,
      experience,
      days_per_week: days,
      session_minutes: minutes,
      avoid,
      units,
    };
    update(() => ({ body: bodyFromForm(), prefs }));
    router.push(currentGym(state) ? "/dashboard" : "/gym");
  }

  const ageNumber = toNumber(age);
  const tooYoung = ageNumber !== null && ageNumber < 18;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <ol className="flex gap-2" aria-label="Setup progress">
          {[1, 2].map((n) => (
            <li
              key={n}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: n <= step ? "var(--plate-yellow)" : "var(--steel-2)" }}
              aria-current={n === step ? "step" : undefined}
            >
              <span className="sr-only">Step {n} of 2</span>
            </li>
          ))}
        </ol>
        <h1 className="display">{step === 1 ? "About you" : "How you want to train"}</h1>
        <p className="lede">
          {step === 1
            ? "Used to estimate effort and calories. Everything here is optional except your age."
            : "Every workout is built around these. You can change them any time."}
        </p>
      </div>

      {step === 1 ? (
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!tooYoung) setStep(2);
          }}
        >
          <fieldset>
            <legend className="field-label">Units</legend>
            <div className="choices">
              {(["lb", "kg"] as Units[]).map((u) => (
                <label key={u} className="choice">
                  <input
                    type="radio"
                    name="units"
                    checked={units === u}
                    onChange={() => {
                      // Convert what was typed so switching units keeps the same values.
                      const w = toNumber(weight);
                      if (w !== null) setWeight(String(u === "lb" ? kgToLb(w) : Math.round(lbToKg(w))));
                      if (u === "kg" && toNumber(heightFt) !== null) {
                        setHeightCm(String(Math.round(ftInToCm(Number(heightFt), Number(heightIn) || 0))));
                      }
                      if (u === "lb" && toNumber(heightCm) !== null) {
                        const h = cmToFtIn(Number(heightCm));
                        setHeightFt(String(h.ft));
                        setHeightIn(String(h.in));
                      }
                      setUnits(u);
                    }}
                  />
                  <span>{u === "lb" ? "Pounds and feet" : "Kilograms and centimetres"}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="age">
                Age
              </label>
              <input
                id="age"
                className="input"
                inputMode="numeric"
                required
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="weight">
                Weight ({units})
              </label>
              <input
                id="weight"
                className="input"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            {units === "lb" ? (
              <div className="col-span-2 grid grid-cols-2 gap-4 sm:col-span-1">
                <div>
                  <label className="field-label" htmlFor="ft">
                    Height (ft)
                  </label>
                  <input
                    id="ft"
                    className="input"
                    inputMode="numeric"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value.replace(/\D/g, "").slice(0, 1))}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="in">
                    (in)
                  </label>
                  <input
                    id="in"
                    className="input"
                    inputMode="numeric"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  />
                </div>
              </div>
            ) : (
              <div className="col-span-2 sm:col-span-1">
                <label className="field-label" htmlFor="cm">
                  Height (cm)
                </label>
                <input
                  id="cm"
                  className="input"
                  inputMode="numeric"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value.replace(/\D/g, "").slice(0, 3))}
                />
              </div>
            )}
            <fieldset className="col-span-2 sm:col-span-1">
              <legend className="field-label">Sex</legend>
              <div className="choices">
                {(
                  [
                    ["female", "Female"],
                    ["male", "Male"],
                    ["unspecified", "Skip"],
                  ] as const
                ).map(([id, label]) => (
                  <label key={id} className="choice">
                    <input type="radio" name="sex" checked={sex === id} onChange={() => setSex(id)} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {tooYoung && (
            <p className="well" role="alert">
              fit³ is for people 18 and older for now.
            </p>
          )}

          <div className="flex justify-end">
            <button className="btn btn-go" disabled={tooYoung}>
              Next
            </button>
          </div>
        </form>
      ) : (
        <form className="flex flex-col gap-7" onSubmit={finish}>
          <fieldset>
            <legend className="field-label">Main goal</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {GOALS.map((g) => (
                <label key={g.id} className="option">
                  <input type="radio" name="goal" checked={goal === g.id} onChange={() => setGoal(g.id)} />
                  <span className="option-body">
                    <span className="display block text-2xl">{g.name}</span>
                    <span className="muted small mt-1 block">{g.detail}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="field-label">Experience</legend>
            <div className="choices">
              {(
                [
                  [1, "New to lifting"],
                  [2, "A year or more"],
                  [3, "Several years"],
                ] as const
              ).map(([level, label]) => (
                <label key={level} className="choice">
                  <input
                    type="radio"
                    name="experience"
                    checked={experience === level}
                    onChange={() => setExperience(level)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="days">
                Days per week: <span className="num text-xl">{days}</span>
              </label>
              <input id="days" type="range" min={1} max={6} value={days} onChange={(e) => setDays(Number(e.target.value))} />
            </div>
            <div>
              <label className="field-label" htmlFor="minutes">
                Usual session: <span className="num text-xl">{minutes}</span> min
              </label>
              <input
                id="minutes"
                type="range"
                min={20}
                max={120}
                step={5}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </div>
          </div>

          <fieldset>
            <legend className="field-label">Leave out</legend>
            <div className="choices">
              {AVOID.map((a) => (
                <label key={a.id} className="choice">
                  <input
                    type="checkbox"
                    checked={avoid.includes(a.id)}
                    onChange={(e) => setAvoid(e.target.checked ? [...avoid, a.id] : avoid.filter((t) => t !== a.id))}
                  />
                  <span>{a.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {!editing && (
            <label className="well flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0"
                style={{ accentColor: "var(--plate-yellow)" }}
                required
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className="small">
                I understand these workouts are general suggestions, not medical advice, and I
                train at my own risk.
              </span>
            </label>
          )}

          <div className="flex justify-between gap-3">
            <button type="button" className="btn" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="btn btn-go">{editing ? "Save" : "Choose my gym"}</button>
          </div>
        </form>
      )}
    </div>
  );
}
