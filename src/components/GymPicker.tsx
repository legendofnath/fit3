"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/app";
import { BASELINES, GYM_TYPES } from "@/lib/catalog";
import { db } from "@/lib/supabase";
import type { Gym, GymType } from "@/lib/types";

/** Find an existing gym or add a new one, then make it the member's gym. */
export function GymPicker({ onPicked }: { onPicked?: () => void }) {
  const { userId, refresh } = useApp();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Gym[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<GymType>("commercial");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const text = query.trim().replace(/[%_,()]/g, " ");
      let request = db().from("gyms").select("*").order("name").limit(25);
      if (text) request = request.or(`name.ilike.%${text}%,address.ilike.%${text}%`);
      const { data } = await request;
      if (active) setResults((data as Gym[] | null) ?? []);
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  async function choose(gymId: string) {
    if (!userId) return;
    setBusy(true);
    setError(null);
    const { error: err } = await db().from("profiles").update({ gym_id: gymId }).eq("id", userId);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    await refresh();
    onPicked?.();
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error: err } = await db().rpc("create_gym", {
      p_name: name,
      p_address: address,
      p_place_id: null,
      p_gym_type: type,
      p_is_private: type === "home",
      p_baseline: BASELINES[type],
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    await choose(data as string);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="gym-search">
          Find your gym
        </label>
        <input
          id="gym-search"
          className="input"
          placeholder="Name, street or city"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <ul className="flex flex-col gap-2">
        {results.map((g) => (
          <li key={g.id}>
            <button
              className="card flex w-full items-center justify-between gap-3 text-left"
              disabled={busy}
              onClick={() => choose(g.id)}
            >
              <span>
                <span className="block font-semibold">{g.name}</span>
                <span className="muted block text-sm">
                  {g.is_private ? "Private" : g.address || "No address"}
                </span>
              </span>
              <span className="muted text-sm">Select</span>
            </button>
          </li>
        ))}
        {results.length === 0 && <li className="muted text-sm">No gyms match yet.</li>}
      </ul>

      {error && <p className="notice notice-error">{error}</p>}

      {!adding ? (
        <button className="btn" onClick={() => setAdding(true)}>
          My gym is not listed
        </button>
      ) : (
        <form onSubmit={create} className="card flex flex-col gap-3">
          <h2>Add a gym</h2>
          <div>
            <label className="label" htmlFor="gym-name">
              Name
            </label>
            <input
              id="gym-name"
              className="input"
              required
              minLength={2}
              maxLength={120}
              placeholder="LA Fitness Mission Viejo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="gym-address">
              Address
            </label>
            <input
              id="gym-address"
              className="input"
              maxLength={200}
              placeholder="24491 Alicia Pkwy, Mission Viejo, CA"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="gym-type">
              Type
            </label>
            <select
              id="gym-type"
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
            <p className="muted mt-1 text-sm">
              {GYM_TYPES.find((t) => t.id === type)?.description}. Starts with{" "}
              {BASELINES[type].length} items you can correct.
            </p>
          </div>
          <button className="btn btn-primary" disabled={busy}>
            Add gym
          </button>
        </form>
      )}
    </div>
  );
}
