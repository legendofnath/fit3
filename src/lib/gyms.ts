import { BASELINES, GYM_TYPES } from "./catalog";
import type { GymType } from "./types";

/** Where we learned that a gym has a piece of equipment. */
export type EquipmentSource = "seen" | "typical" | "added";

export interface GymInfo {
  id: string;
  name: string;
  address: string;
  type: GymType;
  hours?: string[];
  synopsis: string;
  amenities: string[];
  /** Equipment ids with how each was identified. */
  equipment: { id: string; source: EquipmentSource }[];
  custom?: boolean;
}

function typical(type: GymType, except: string[] = []) {
  return BASELINES[type]
    .filter((id) => !except.includes(id))
    .map((id) => ({ id, source: "typical" as const }));
}

/**
 * Gyms that ship with the app. The LA Fitness entry was put together from its
 * Google Maps listing photos and reviews on 14 November 2026.
 */
export const SEEDED_GYMS: GymInfo[] = [
  {
    id: "lafitness-mission-viejo-alicia",
    name: "LA Fitness",
    address: "24491 Alicia Pkwy, Mission Viejo, CA 92691",
    type: "commercial",
    hours: [
      "Mon to Thu 5 am to 11 pm",
      "Fri 5 am to 10 pm",
      "Sat and Sun 8 am to 8 pm",
    ],
    synopsis:
      "A large commercial club in Alicia Towne Plaza. Rows of cardio machines and a full selectorized strength floor, plus a turf lane with a sled, a lap pool, racquetball courts and a sauna. Reviews say it is busy at peak times, short on freestanding dip bars and light on kettlebells.",
    amenities: ["Lap pool", "Racquetball courts", "Sauna", "Turf lane", "Group cycling room", "Free parking"],
    equipment: [
      ...typical("commercial", ["dip_station"]).map((item) =>
        ["treadmill", "elliptical", "stationary_bike", "stair_climber", "leg_press", "flat_bench", "power_rack", "dumbbells"].includes(item.id)
          ? { ...item, source: "seen" as const }
          : item,
      ),
      { id: "sled", source: "seen" },
      { id: "kettlebells", source: "seen" },
      { id: "stability_ball", source: "seen" },
      { id: "pool", source: "seen" },
      { id: "court", source: "seen" },
      { id: "sauna", source: "seen" },
    ],
  },
];

/** Build a gym record for one the member adds themselves. */
export function makeCustomGym(name: string, address: string, type: GymType): GymInfo {
  const kind = GYM_TYPES.find((t) => t.id === type);
  return {
    id: `custom-${Date.now().toString(36)}`,
    name: name.trim(),
    address: address.trim(),
    type,
    synopsis: `${kind?.name ?? "Gym"} you added. It starts with the equipment most gyms of this type have; correct it from the equipment screen.`,
    amenities: [],
    equipment: typical(type),
    custom: true,
  };
}

export interface EquipmentEdits {
  added: string[];
  removed: string[];
}

/** The gym's equipment after the member's own corrections. */
export function resolveEquipment(gym: GymInfo, edits: EquipmentEdits | undefined) {
  const removed = new Set(edits?.removed ?? []);
  const list = gym.equipment.filter((item) => !removed.has(item.id));
  for (const id of edits?.added ?? []) {
    if (!list.some((item) => item.id === id)) list.push({ id, source: "added" });
  }
  return list;
}
