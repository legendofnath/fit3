"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { configured, db } from "./supabase";
import type { Gym, GymEquipmentRow, Profile } from "./types";

interface AppState {
  /** False while the first load is running. */
  ready: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  gym: Gym | null;
  equipment: GymEquipmentRow[];
  /** Catalog ids present at the current gym. */
  available: Set<string>;
  /** Reload profile, gym and equipment from the database. */
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!configured);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [equipment, setEquipment] = useState<GymEquipmentRow[]>([]);

  const load = useCallback(async (uid: string | null) => {
    if (!uid) {
      setProfile(null);
      setGym(null);
      setEquipment([]);
      return;
    }
    const { data: p } = await db().from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile((p as Profile | null) ?? null);
    const gymId = (p as Profile | null)?.gym_id;
    if (!gymId) {
      setGym(null);
      setEquipment([]);
      return;
    }
    const [{ data: g }, { data: rows }] = await Promise.all([
      db().from("gyms").select("*").eq("id", gymId).maybeSingle(),
      db().from("gym_equipment").select("*").eq("gym_id", gymId),
    ]);
    setGym((g as Gym | null) ?? null);
    setEquipment((rows as GymEquipmentRow[] | null) ?? []);
  }, []);

  useEffect(() => {
    if (!configured) return;
    let active = true;
    const apply = async (uid: string | null, mail: string | null) => {
      if (!active) return;
      setUserId(uid);
      setEmail(mail);
      await load(uid);
      if (active) setReady(true);
    };
    db()
      .auth.getSession()
      .then(({ data }) => apply(data.session?.user.id ?? null, data.session?.user.email ?? null));
    const { data: sub } = db().auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        // Defer so we never call Supabase from inside its own auth callback.
        setTimeout(() => apply(session?.user.id ?? null, session?.user.email ?? null), 0);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  const refresh = useCallback(() => load(userId), [load, userId]);

  const available = useMemo(
    () => new Set(equipment.filter((row) => row.present).map((row) => row.equipment_id)),
    [equipment],
  );

  const value = useMemo(
    () => ({ ready, userId, email, profile, gym, equipment, available, refresh }),
    [ready, userId, email, profile, gym, equipment, available, refresh],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
