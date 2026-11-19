"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORY_COLOR, EquipmentArt } from "@/components/EquipmentArt";
import { CATEGORIES, EQUIPMENT_BY_ID, GYM_TYPES } from "@/lib/catalog";
import { makeCustomGym } from "@/lib/gyms";
import { allGyms, gymEquipment, update, useStore } from "@/lib/store";
import type { GymType } from "@/lib/types";

export default function GymPage() {
  const state = useStore();
  const router = useRouter();
  const gyms = allGyms(state);
  const [picked, setPicked] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<GymType>("commercial");

  if (!state.hydrated) return null;

  const selectedId = picked ?? state.gymId ?? gyms[0]?.id;
  const gym = gyms.find((g) => g.id === selectedId) ?? gyms[0];
  const q = query.trim().toLowerCase();
  const visible = gyms.filter(
    (g) => !q || g.name.toLowerCase().includes(q) || g.address.toLowerCase().includes(q),
  );
  const equipment = gymEquipment(state, gym);
  const isCurrent = state.gymId === gym.id;

  function trainHere() {
    update(() => ({ gymId: gym.id }));
    router.push("/dashboard");
  }

  function addGym(event: React.FormEvent) {
    event.preventDefault();
    const created = makeCustomGym(name, address, type);
    update((s) => ({ customGyms: [...s.customGyms, created] }));
    setPicked(created.id);
    setAdding(false);
    setName("");
    setAddress("");
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="display">Pick your gym</h1>
        <p className="lede">Workouts only use equipment this gym has.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <aside className="flex flex-col gap-3">
          <label className="sr-only" htmlFor="gym-search">
            Search gyms
          </label>
          <input
            id="gym-search"
            className="input"
            placeholder="Search by name or city"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className="flex flex-col gap-2">
            {visible.map((g) => (
              <li key={g.id}>
                <button
                  className="well w-full text-left"
                  style={g.id === gym.id ? { outline: "1.5px solid var(--chalk)" } : undefined}
                  aria-pressed={g.id === gym.id}
                  onClick={() => setPicked(g.id)}
                >
                  <span className="block font-semibold">
                    {g.name}
                    {state.gymId === g.id && <span className="muted small font-normal"> (your gym)</span>}
                  </span>
                  <span className="muted small block">{g.address || "No address"}</span>
                </button>
              </li>
            ))}
            {visible.length === 0 && <li className="muted small">No gyms match. Add yours below.</li>}
          </ul>

          {!adding ? (
            <button className="btn" onClick={() => setAdding(true)}>
              Add my gym
            </button>
          ) : (
            <form onSubmit={addGym} className="panel flex flex-col gap-4">
              <h3>Add a gym</h3>
              <div>
                <label className="field-label" htmlFor="new-name">
                  Name
                </label>
                <input
                  id="new-name"
                  className="input"
                  required
                  minLength={2}
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="new-address">
                  Address or city
                </label>
                <input
                  id="new-address"
                  className="input"
                  maxLength={120}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="new-type">
                  What kind of gym
                </label>
                <select
                  id="new-type"
                  className="input"
                  value={type}
                  onChange={(e) => setType(e.target.value as GymType)}
                >
                  {GYM_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <p className="muted small mt-1">{GYM_TYPES.find((t) => t.id === type)?.description}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-go btn-sm">Add gym</button>
                <button type="button" className="btn btn-sm" onClick={() => setAdding(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </aside>

        <article className="panel flex flex-col gap-6" aria-live="polite">
          <header className="flex flex-col gap-1">
            <h2 className="display">{gym.name}</h2>
            <p className="muted">{gym.address}</p>
          </header>

          <p className="max-w-prose">{gym.synopsis}</p>

          {(gym.hours || gym.amenities.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {gym.hours && (
                <div>
                  <h3 className="mb-2">Hours</h3>
                  <ul className="muted small">
                    {gym.hours.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
              {gym.amenities.length > 0 && (
                <div>
                  <h3 className="mb-2">Also here</h3>
                  <ul className="flex flex-wrap gap-2">
                    {gym.amenities.map((a) => (
                      <li key={a} className="tag">
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3>
                Possible equipment <span className="num text-xl">{equipment.length}</span>
              </h3>
              <Link
                href="/equipment"
                className="small font-semibold underline underline-offset-4"
                onClick={() => update(() => ({ gymId: gym.id }))}
              >
                View all
              </Link>
            </div>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {equipment.slice(0, 12).map((item) => (
                <li key={item.id} className="well flex flex-col items-center gap-1 p-2 text-center">
                  <EquipmentArt id={item.id} className="w-full" />
                  <span className="small leading-tight">{EQUIPMENT_BY_ID[item.id]?.name ?? item.id}</span>
                </li>
              ))}
            </ul>
            <ul className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const count = equipment.filter((item) => EQUIPMENT_BY_ID[item.id]?.category === c).length;
                if (!count) return null;
                return (
                  <li key={c} className="tag">
                    <span className="tag-dot" style={{ color: CATEGORY_COLOR[c] }} />
                    {c} {count}
                  </li>
                );
              })}
            </ul>
            <p className="muted small">
              {gym.custom
                ? "Based on what most gyms of this type have."
                : "Seen in this gym's public photos and reviews, plus what most gyms of this type have. Correct anything that is wrong on the equipment screen."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="btn btn-go" onClick={trainHere}>
              {isCurrent ? "Go to workout" : "Train here"}
            </button>
            <Link href="/equipment" className="btn" onClick={() => update(() => ({ gymId: gym.id }))}>
              Browse equipment
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
