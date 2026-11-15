"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GymPicker } from "@/components/GymPicker";
import { useApp } from "@/lib/app";
import { CATEGORIES, EQUIPMENT, EQUIPMENT_BY_ID, searchEquipment } from "@/lib/catalog";
import { db } from "@/lib/supabase";
import type { EquipmentChange, GymEquipmentRow } from "@/lib/types";

function labelFor(id: string, customName: string | null): string {
  return EQUIPMENT_BY_ID[id]?.name ?? customName ?? id;
}

export default function GymPage() {
  const { userId, gym, equipment, refresh } = useApp();
  const [changing, setChanging] = useState(false);
  const [query, setQuery] = useState("");
  const [changes, setChanges] = useState<EquipmentChange[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState<string | null>(null);

  const gymId = gym?.id;
  const loadChanges = useCallback(async () => {
    if (!gymId) return;
    const { data } = await db()
      .from("equipment_changes")
      .select("*")
      .eq("gym_id", gymId)
      .order("created_at", { ascending: false })
      .limit(15);
    setChanges((data as EquipmentChange[] | null) ?? []);
  }, [gymId]);

  useEffect(() => {
    // Fetch-on-mount: the result is set asynchronously once the request returns.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChanges();
  }, [loadChanges]);

  const present = useMemo(() => equipment.filter((row) => row.present), [equipment]);
  const removed = useMemo(() => equipment.filter((row) => !row.present), [equipment]);
  const presentIds = useMemo(() => new Set(present.map((row) => row.equipment_id)), [present]);
  const custom = present.filter((row) => !EQUIPMENT_BY_ID[row.equipment_id]);

  const matches = query.trim()
    ? searchEquipment(query).filter((item) => !presentIds.has(item.id))
    : [];
  const exactCustom = custom.some(
    (row) => row.custom_name?.toLowerCase() === query.trim().toLowerCase(),
  );

  if (!gym) return null;

  async function change(
    equipmentId: string,
    action: "add" | "remove" | "restore",
    customName: string | null = null,
  ) {
    if (!gym) return;
    setBusy(true);
    setError(null);
    setThanks(null);
    const { error: err } = await db().rpc("change_gym_equipment", {
      p_gym: gym.id,
      p_equipment: equipmentId,
      p_action: action,
      p_custom_name: customName,
    });
    if (err) setError(err.message);
    else {
      setThanks(
        gym.is_private
          ? "Updated."
          : "Updated for everyone who trains here. Thanks for keeping this gym accurate.",
      );
      setQuery("");
    }
    await Promise.all([refresh(), loadChanges()]);
    setBusy(false);
  }

  if (changing) {
    return (
      <div className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <h1>Change gym</h1>
          <button className="btn btn-small" onClick={() => setChanging(false)}>
            Cancel
          </button>
        </header>
        <GymPicker onPicked={() => setChanging(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1>{gym.name}</h1>
          <p className="muted text-sm">
            {gym.is_private ? "Private, only you can see it" : gym.address || "No address"} ·{" "}
            {present.length} items
          </p>
        </div>
        <button className="btn btn-small" onClick={() => setChanging(true)}>
          Change
        </button>
      </header>

      {error && <p className="notice notice-error">{error}</p>}
      {thanks && <p className="notice">{thanks}</p>}

      <section className="card flex flex-col gap-3">
        <label className="label" htmlFor="add-equipment">
          Add equipment
        </label>
        <input
          id="add-equipment"
          className="input"
          placeholder="Search, for example hack squat or rower"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {matches.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3">
            <span>
              {item.name} <span className="muted text-sm">· {item.category}</span>
            </span>
            <button className="btn btn-small" disabled={busy} onClick={() => change(item.id, "add")}>
              Add
            </button>
          </div>
        ))}
        {query.trim().length >= 3 && matches.length === 0 && !exactCustom && (
          <div className="flex flex-col gap-2">
            <p className="muted text-sm">
              Not in the catalog, or this gym already has it. You can add it as a custom item.
              Workouts do not use custom items yet.
            </p>
            <button
              className="btn btn-small self-start"
              disabled={busy}
              onClick={() => change(`custom:${crypto.randomUUID()}`, "add", query.trim().slice(0, 80))}
            >
              Add “{query.trim()}” as custom
            </button>
          </div>
        )}
      </section>

      {CATEGORIES.map((category) => {
        const rows = present.filter((row) => EQUIPMENT_BY_ID[row.equipment_id]?.category === category);
        if (rows.length === 0) return null;
        return <EquipmentGroup key={category} title={category} rows={rows} busy={busy} onRemove={change} />;
      })}
      {custom.length > 0 && (
        <EquipmentGroup title="Added by members" rows={custom} busy={busy} onRemove={change} />
      )}
      {present.length === 0 && (
        <p className="muted">
          No equipment listed. Workouts will use bodyweight exercises until you add some.
        </p>
      )}

      {removed.length > 0 && (
        <section>
          <h2 className="mb-2">Reported missing</h2>
          <ul className="card flex flex-col gap-2">
            {removed.map((row) => (
              <li key={row.equipment_id} className="flex items-center justify-between gap-3">
                <span className="muted">{labelFor(row.equipment_id, row.custom_name)}</span>
                <button
                  className="btn btn-small"
                  disabled={busy}
                  onClick={() => change(row.equipment_id, "restore", row.custom_name)}
                >
                  It&apos;s here
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {changes.length > 0 && (
        <section>
          <h2 className="mb-2">Recent changes</h2>
          <ul className="card flex flex-col gap-2 text-sm">
            {changes.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <span>
                  {c.user_id === userId ? "You" : "A member"}{" "}
                  {c.action === "remove" ? "removed" : c.action === "add" ? "added" : "restored"}{" "}
                  {labelFor(c.equipment_id, c.custom_name)}
                  <span className="muted"> · {new Date(c.created_at).toLocaleDateString()}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="muted mt-2 text-sm">
            Each account can make 30 equipment changes per day. {EQUIPMENT.length} items in the
            catalog.
          </p>
        </section>
      )}
    </div>
  );
}

function EquipmentGroup({
  title,
  rows,
  busy,
  onRemove,
}: {
  title: string;
  rows: GymEquipmentRow[];
  busy: boolean;
  onRemove: (id: string, action: "remove", customName: string | null) => void;
}) {
  return (
    <section>
      <h2 className="mb-2">{title}</h2>
      <ul className="card flex flex-col gap-2">
        {rows
          .slice()
          .sort((a, b) =>
            labelFor(a.equipment_id, a.custom_name).localeCompare(labelFor(b.equipment_id, b.custom_name)),
          )
          .map((row) => (
            <li key={row.equipment_id} className="flex items-center justify-between gap-3">
              <span>{labelFor(row.equipment_id, row.custom_name)}</span>
              <button
                className="btn btn-small btn-quiet"
                disabled={busy}
                onClick={() => onRemove(row.equipment_id, "remove", row.custom_name)}
              >
                Not here
              </button>
            </li>
          ))}
      </ul>
    </section>
  );
}
