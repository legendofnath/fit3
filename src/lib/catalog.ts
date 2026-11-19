import type { Equipment, EquipmentCategory, GymType } from "./types";

function e(id: string, name: string, category: EquipmentCategory, aliases: string[] = []): Equipment {
  return { id, name, category, aliases };
}

/** Every piece of equipment fit^3 knows about. Bodyweight is always available and has no entry. */
export const EQUIPMENT: Equipment[] = [
  e("dumbbells", "Dumbbells", "Free weights", ["db", "free weights"]),
  e("barbell", "Barbell and plates", "Free weights", ["olympic bar", "bar", "plates"]),
  e("ez_bar", "EZ curl bar", "Free weights", ["curl bar"]),
  e("kettlebells", "Kettlebells", "Free weights", ["kb"]),
  e("trap_bar", "Trap bar", "Free weights", ["hex bar"]),
  e("safety_squat_bar", "Safety squat bar", "Free weights", ["ssb", "yoke bar"]),
  e("cambered_bar", "Cambered bar", "Free weights", ["buffalo bar"]),
  e("fixed_barbells", "Fixed-weight barbells", "Free weights", ["pre-loaded barbells", "straight bars"]),
  e("weight_plates", "Weight plates", "Free weights", ["plates", "bumpers"]),
  e("dip_belt", "Dip belt", "Free weights", ["weight belt chain"]),

  e("flat_bench", "Flat bench", "Benches and racks", ["bench"]),
  e("adjustable_bench", "Adjustable bench", "Benches and racks", ["incline bench"]),
  e("power_rack", "Power rack or squat rack", "Benches and racks", ["squat rack", "cage", "half rack"]),
  e("smith_machine", "Smith machine", "Benches and racks", ["smith"]),
  e("pull_up_bar", "Pull-up bar", "Benches and racks", ["chin-up bar"]),
  e("dip_station", "Dip station", "Benches and racks", ["dip bars", "parallel bars"]),
  e("preacher_bench", "Preacher curl bench", "Benches and racks", ["preacher"]),
  e("landmine", "Landmine attachment", "Benches and racks", ["t-bar"]),
  e("back_extension", "Back extension bench", "Benches and racks", ["roman chair", "hyperextension"]),
  e("decline_bench", "Decline bench", "Benches and racks", ["sit-up bench"]),
  e("ghd", "Glute-ham developer", "Benches and racks", ["ghd", "glute ham raise"]),
  e("captains_chair", "Vertical knee raise station", "Benches and racks", ["captain's chair", "vkr"]),
  e("squat_stand", "Squat stands", "Benches and racks", ["squat stand"]),

  e("cable_station", "Cable station", "Cables and machines", ["cable crossover", "functional trainer", "cables", "pulley"]),
  e("lat_pulldown", "Lat pulldown machine", "Cables and machines", ["pulldown"]),
  e("seated_cable_row", "Seated cable row", "Cables and machines", ["low row", "row machine"]),
  e("leg_press", "Leg press", "Cables and machines", ["sled press"]),
  e("hack_squat", "Hack squat machine", "Cables and machines", ["hack"]),
  e("leg_extension", "Leg extension machine", "Cables and machines", ["quad extension"]),
  e("leg_curl", "Leg curl machine", "Cables and machines", ["hamstring curl"]),
  e("chest_press_machine", "Chest press machine", "Cables and machines", ["machine press"]),
  e("shoulder_press_machine", "Shoulder press machine", "Cables and machines", ["overhead press machine"]),
  e("pec_deck", "Pec deck", "Cables and machines", ["chest fly machine", "butterfly", "rear delt machine"]),
  e("assisted_pull_up", "Assisted pull-up machine", "Cables and machines", ["assisted dip", "gravitron"]),
  e("calf_raise_machine", "Calf raise machine", "Cables and machines", ["standing calf", "seated calf"]),
  e("ab_crunch_machine", "Ab crunch machine", "Cables and machines", ["ab machine"]),
  e("hip_abductor", "Hip abductor and adductor machine", "Cables and machines", ["inner thigh", "outer thigh"]),
  e("chest_supported_row", "Chest-supported row machine", "Cables and machines", ["t-bar row", "iso-lateral row", "hammer strength row"]),
  e("plate_loaded_press", "Plate-loaded chest press", "Cables and machines", ["iso-lateral press", "hammer strength press"]),
  e("incline_press_machine", "Incline press machine", "Cables and machines", ["incline chest press"]),
  e("belt_squat", "Belt squat machine", "Cables and machines", ["belt squat"]),
  e("pendulum_squat", "Pendulum squat", "Cables and machines", ["pendulum"]),
  e("hip_thrust_machine", "Hip thrust machine", "Cables and machines", ["glute drive", "glute bridge machine"]),
  e("glute_kickback_machine", "Glute kickback machine", "Cables and machines", ["kickback machine"]),
  e("seated_leg_curl", "Seated leg curl", "Cables and machines", ["seated hamstring curl"]),
  e("seated_calf_raise", "Seated calf raise machine", "Cables and machines", ["seated calf"]),
  e("preacher_curl_machine", "Preacher curl machine", "Cables and machines", ["biceps machine", "arm curl machine"]),
  e("triceps_machine", "Triceps extension machine", "Cables and machines", ["dip machine", "triceps press machine"]),
  e("lateral_raise_machine", "Lateral raise machine", "Cables and machines", ["side raise machine", "delt machine"]),
  e("rope_attachment", "Cable rope attachment", "Cables and machines", ["rope", "tricep rope"]),
  e("v_bar", "Cable V-bar", "Cables and machines", ["close grip handle", "v handle"]),
  e("ankle_strap", "Cable ankle strap", "Cables and machines", ["ankle cuff"]),

  e("treadmill", "Treadmill", "Cardio", ["running machine"]),
  e("elliptical", "Elliptical", "Cardio", ["cross trainer"]),
  e("stationary_bike", "Stationary bike", "Cardio", ["spin bike", "exercise bike", "cycle"]),
  e("stair_climber", "Stair climber", "Cardio", ["stairmaster", "step mill"]),
  e("rowing_machine", "Rowing machine", "Cardio", ["rower", "erg", "concept2"]),
  e("air_bike", "Air bike", "Cardio", ["assault bike", "fan bike"]),
  e("ski_erg", "Ski erg", "Cardio", ["skierg"]),
  e("curved_treadmill", "Curved treadmill", "Cardio", ["woodway", "assault runner"]),
  e("recumbent_bike", "Recumbent bike", "Cardio", ["seated bike"]),
  e("versaclimber", "Climbing machine", "Cardio", ["versaclimber", "jacobs ladder"]),
  e("jump_rope", "Jump rope", "Cardio", ["skipping rope"]),

  e("plyo_box", "Plyo box", "Functional", ["jump box", "step"]),
  e("medicine_ball", "Medicine ball", "Functional", ["med ball", "slam ball", "wall ball"]),
  e("battle_ropes", "Battle ropes", "Functional", ["ropes"]),
  e("sled", "Sled", "Functional", ["prowler", "push sled"]),
  e("resistance_bands", "Resistance bands", "Functional", ["bands"]),
  e("suspension_trainer", "Suspension straps", "Functional", ["trx", "rings"]),
  e("ab_wheel", "Ab wheel", "Functional", ["roller"]),
  e("stability_ball", "Stability ball", "Functional", ["swiss ball", "exercise ball", "bosu"]),
  e("sandbag", "Sandbag", "Functional", ["sand bag"]),
  e("farmers_handles", "Farmer's carry handles", "Functional", ["farmers walk"]),
  e("gymnastic_rings", "Gymnastic rings", "Functional", ["rings"]),
  e("parallettes", "Parallettes", "Functional", ["push-up bars"]),
  e("slam_ball", "Slam ball", "Functional", ["dead ball"]),
  e("mat", "Exercise mat", "Functional", ["mat", "stretching area"]),

  e("pool", "Pool", "Other", ["lap pool", "swimming"]),
  e("court", "Sports court", "Other", ["racquetball", "basketball", "handball"]),
  e("sauna", "Sauna", "Other", ["steam room"]),
];

export const EQUIPMENT_BY_ID: Record<string, Equipment> = Object.fromEntries(
  EQUIPMENT.map((x) => [x.id, x]),
);

export const CATEGORIES: EquipmentCategory[] = [
  "Free weights",
  "Benches and racks",
  "Cables and machines",
  "Cardio",
  "Functional",
  "Other",
];

export const GYM_TYPES: { id: GymType; name: string; description: string }[] = [
  { id: "commercial", name: "Commercial chain", description: "LA Fitness, 24 Hour Fitness, Planet Fitness, Crunch and similar" },
  { id: "strength", name: "Strength gym", description: "Barbell, powerlifting or bodybuilding focused" },
  { id: "functional", name: "Functional or CrossFit-style", description: "Open floor, rigs, kettlebells, rowers" },
  { id: "small", name: "Small or hotel gym", description: "Apartment, office or hotel fitness room" },
  { id: "home", name: "Home gym (private)", description: "Only you can see it. Starts empty." },
];

/** Starting equipment for a new gym of each type. Members correct it from there. */
export const BASELINES: Record<GymType, string[]> = {
  commercial: [
    "dumbbells", "barbell", "flat_bench", "adjustable_bench", "power_rack", "smith_machine",
    "cable_station", "lat_pulldown", "seated_cable_row", "leg_press", "leg_extension", "leg_curl",
    "chest_press_machine", "shoulder_press_machine", "pec_deck", "pull_up_bar", "dip_station",
    "treadmill", "elliptical", "stationary_bike", "stair_climber", "decline_bench",
    "back_extension", "captains_chair", "seated_calf_raise", "preacher_curl_machine",
    "triceps_machine", "hip_abductor", "ab_crunch_machine", "rope_attachment", "v_bar",
    "ez_bar", "fixed_barbells", "weight_plates", "mat", "assisted_pull_up", "calf_raise_machine",
  ],
  strength: [
    "dumbbells", "barbell", "flat_bench", "adjustable_bench", "power_rack", "pull_up_bar",
    "dip_station", "cable_station", "kettlebells", "weight_plates", "ez_bar", "trap_bar",
    "lat_pulldown", "seated_cable_row", "leg_press", "back_extension", "rope_attachment", "dip_belt", "mat",
  ],
  functional: [
    "barbell", "power_rack", "pull_up_bar", "kettlebells", "dumbbells", "rowing_machine",
    "plyo_box", "medicine_ball", "flat_bench", "weight_plates", "air_bike", "ski_erg",
    "jump_rope", "gymnastic_rings", "slam_ball", "sandbag", "resistance_bands", "mat", "ab_wheel",
  ],
  small: ["dumbbells", "adjustable_bench", "cable_station", "treadmill", "stationary_bike", "mat", "stability_ball"],
  home: [],
};

/** Case-insensitive search over names and alternative names. */
export function searchEquipment(query: string): Equipment[] {
  const q = query.trim().toLowerCase();
  if (!q) return EQUIPMENT;
  return EQUIPMENT.filter(
    (x) => x.name.toLowerCase().includes(q) || x.aliases.some((a) => a.includes(q)),
  );
}
