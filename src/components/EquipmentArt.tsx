import { EQUIPMENT_BY_ID } from "@/lib/catalog";
import type { EquipmentCategory } from "@/lib/types";

/** Bumper-plate colours, one per equipment category. */
export const CATEGORY_COLOR: Record<EquipmentCategory, string> = {
  "Free weights": "var(--plate-red)",
  "Benches and racks": "var(--plate-blue)",
  "Cables and machines": "var(--plate-yellow)",
  Cardio: "var(--plate-green)",
  Functional: "var(--chalk)",
  Other: "var(--slate)",
};

const FLOOR = <line x1="8" y1="108" x2="152" y2="108" className="art-floor" />;

/** Simple line drawings of each piece of equipment. Unknown ids fall back to their category. */
const DRAWINGS: Record<string, React.ReactNode> = {
  dumbbells: (
    <>
      <rect x="22" y="52" width="10" height="30" rx="2" className="art-fill" />
      <rect x="32" y="58" width="6" height="18" rx="1" className="art-fill" />
      <line x1="38" y1="67" x2="64" y2="67" />
      <rect x="64" y="58" width="6" height="18" rx="1" className="art-fill" />
      <rect x="70" y="52" width="10" height="30" rx="2" className="art-fill" />
      <rect x="84" y="70" width="9" height="26" rx="2" className="art-fill" />
      <rect x="93" y="75" width="5" height="16" rx="1" className="art-fill" />
      <line x1="98" y1="83" x2="122" y2="83" />
      <rect x="122" y="75" width="5" height="16" rx="1" className="art-fill" />
      <rect x="127" y="70" width="9" height="26" rx="2" className="art-fill" />
      {FLOOR}
    </>
  ),
  barbell: (
    <>
      <line x1="8" y1="64" x2="152" y2="64" />
      <rect x="24" y="34" width="10" height="60" rx="2" className="art-fill" />
      <rect x="36" y="42" width="7" height="44" rx="2" className="art-fill" />
      <rect x="117" y="42" width="7" height="44" rx="2" className="art-fill" />
      <rect x="126" y="34" width="10" height="60" rx="2" className="art-fill" />
      <line x1="46" y1="58" x2="46" y2="70" />
      <line x1="114" y1="58" x2="114" y2="70" />
      {FLOOR}
    </>
  ),
  ez_bar: (
    <>
      <path d="M14 64 H52 L60 58 L68 70 L76 58 L84 70 L92 58 L100 70 L108 64 H146" />
      <rect x="22" y="44" width="8" height="40" rx="2" className="art-fill" />
      <rect x="130" y="44" width="8" height="40" rx="2" className="art-fill" />
      {FLOOR}
    </>
  ),
  trap_bar: (
    <>
      <path d="M50 46 L110 46 L126 64 L110 82 L50 82 L34 64 Z" />
      <line x1="70" y1="46" x2="70" y2="82" />
      <line x1="90" y1="46" x2="90" y2="82" />
      <line x1="10" y1="64" x2="34" y2="64" />
      <line x1="126" y1="64" x2="150" y2="64" />
      <rect x="14" y="44" width="8" height="40" rx="2" className="art-fill" />
      <rect x="138" y="44" width="8" height="40" rx="2" className="art-fill" />
      {FLOOR}
    </>
  ),
  kettlebells: (
    <>
      <path d="M44 56 C44 36 76 36 76 56" />
      <circle cx="60" cy="80" r="24" className="art-fill" />
      <path d="M100 70 C100 56 122 56 122 70" />
      <circle cx="111" cy="90" r="16" className="art-fill" />
      {FLOOR}
    </>
  ),
  flat_bench: (
    <>
      <rect x="22" y="58" width="116" height="12" rx="5" className="art-fill" />
      <line x1="40" y1="70" x2="40" y2="108" />
      <line x1="120" y1="70" x2="120" y2="108" />
      <line x1="30" y1="108" x2="50" y2="108" />
      <line x1="110" y1="108" x2="130" y2="108" />
      {FLOOR}
    </>
  ),
  adjustable_bench: (
    <>
      <rect x="70" y="70" width="58" height="11" rx="5" className="art-fill" />
      <path d="M68 74 L30 30 L22 37 L60 81 Z" className="art-fill" />
      <line x1="60" y1="81" x2="52" y2="108" />
      <line x1="118" y1="81" x2="118" y2="108" />
      <line x1="44" y1="108" x2="128" y2="108" />
      {FLOOR}
    </>
  ),
  power_rack: (
    <>
      <rect x="34" y="14" width="92" height="94" />
      <line x1="34" y1="34" x2="126" y2="34" />
      {[44, 54, 64, 74, 84].map((y) => (
        <g key={y}>
          <circle cx="38" cy={y} r="1.5" className="art-dot" />
          <circle cx="122" cy={y} r="1.5" className="art-dot" />
        </g>
      ))}
      <line x1="12" y1="58" x2="148" y2="58" />
      <rect x="18" y="42" width="8" height="32" rx="2" className="art-fill" />
      <rect x="134" y="42" width="8" height="32" rx="2" className="art-fill" />
      <line x1="34" y1="82" x2="46" y2="82" />
      <line x1="114" y1="82" x2="126" y2="82" />
      {FLOOR}
    </>
  ),
  smith_machine: (
    <>
      <rect x="30" y="14" width="100" height="94" />
      <line x1="48" y1="14" x2="48" y2="108" className="art-thin" />
      <line x1="112" y1="14" x2="112" y2="108" className="art-thin" />
      <line x1="22" y1="54" x2="138" y2="54" />
      <rect x="42" y="50" width="12" height="8" rx="2" className="art-fill" />
      <rect x="106" y="50" width="12" height="8" rx="2" className="art-fill" />
      {FLOOR}
    </>
  ),
  cable_station: (
    <>
      <rect x="18" y="14" width="22" height="94" />
      <rect x="120" y="14" width="22" height="94" />
      <line x1="18" y1="14" x2="142" y2="14" />
      <rect x="22" y="74" width="14" height="30" className="art-fill" />
      <rect x="124" y="74" width="14" height="30" className="art-fill" />
      <circle cx="44" cy="30" r="4" />
      <circle cx="116" cy="30" r="4" />
      <path d="M44 34 L70 66" className="art-thin" />
      <path d="M116 34 L90 66" className="art-thin" />
      <path d="M66 64 h8 v6 h-8 z" className="art-fill" />
      <path d="M86 64 h8 v6 h-8 z" className="art-fill" />
      {FLOOR}
    </>
  ),
  lat_pulldown: (
    <>
      <rect x="104" y="14" width="22" height="94" />
      <rect x="108" y="70" width="14" height="34" className="art-fill" />
      <line x1="104" y1="18" x2="66" y2="18" />
      <circle cx="66" cy="22" r="3" />
      <line x1="66" y1="25" x2="66" y2="40" className="art-thin" />
      <path d="M38 44 Q66 36 94 44" />
      <rect x="54" y="84" width="34" height="8" rx="3" className="art-fill" />
      <rect x="58" y="66" width="26" height="7" rx="3" className="art-fill" />
      <line x1="71" y1="92" x2="71" y2="108" />
      <line x1="88" y1="88" x2="104" y2="88" />
      {FLOOR}
    </>
  ),
  seated_cable_row: (
    <>
      <rect x="120" y="40" width="20" height="68" />
      <rect x="124" y="74" width="12" height="30" className="art-fill" />
      <line x1="14" y1="98" x2="120" y2="98" />
      <rect x="36" y="86" width="34" height="8" rx="3" className="art-fill" />
      <path d="M96 80 L104 96" />
      <rect x="100" y="76" width="8" height="20" rx="2" className="art-fill" />
      <line x1="120" y1="84" x2="84" y2="78" className="art-thin" />
      <path d="M78 74 h8 v8 h-8 z" className="art-fill" />
      {FLOOR}
    </>
  ),
  leg_press: (
    <>
      <line x1="24" y1="100" x2="132" y2="32" />
      <line x1="34" y1="106" x2="142" y2="38" />
      <rect x="96" y="30" width="20" height="34" rx="2" transform="rotate(-32 106 47)" className="art-fill" />
      <path d="M30 100 L54 70 L64 78 L44 102 Z" className="art-fill" />
      <rect x="14" y="94" width="46" height="8" rx="3" className="art-fill" />
      {FLOOR}
    </>
  ),
  hack_squat: (
    <>
      <line x1="50" y1="108" x2="96" y2="14" />
      <line x1="64" y1="108" x2="110" y2="14" />
      <rect x="64" y="40" width="14" height="40" rx="3" transform="rotate(26 71 60)" className="art-fill" />
      <rect x="22" y="98" width="48" height="8" rx="2" className="art-fill" />
      {FLOOR}
    </>
  ),
  leg_extension: (
    <>
      <rect x="44" y="34" width="12" height="44" rx="4" className="art-fill" />
      <rect x="54" y="68" width="44" height="10" rx="4" className="art-fill" />
      <line x1="98" y1="74" x2="112" y2="96" />
      <circle cx="114" cy="98" r="5" className="art-fill" />
      <line x1="70" y1="78" x2="70" y2="108" />
      <rect x="20" y="64" width="16" height="40" className="art-fill" />
      {FLOOR}
    </>
  ),
  leg_curl: (
    <>
      <rect x="24" y="58" width="92" height="10" rx="4" className="art-fill" />
      <line x1="116" y1="62" x2="132" y2="80" />
      <circle cx="134" cy="82" r="5" className="art-fill" />
      <line x1="40" y1="68" x2="40" y2="108" />
      <line x1="100" y1="68" x2="100" y2="108" />
      {FLOOR}
    </>
  ),
  chest_press_machine: (
    <>
      <rect x="30" y="30" width="12" height="52" rx="4" className="art-fill" />
      <rect x="30" y="80" width="40" height="10" rx="4" className="art-fill" />
      <path d="M42 50 L92 46 L104 54" />
      <rect x="102" y="48" width="12" height="16" rx="2" className="art-fill" />
      <rect x="120" y="20" width="22" height="88" />
      <rect x="124" y="70" width="14" height="34" className="art-fill" />
      <line x1="50" y1="90" x2="50" y2="108" />
      {FLOOR}
    </>
  ),
  shoulder_press_machine: (
    <>
      <rect x="30" y="26" width="12" height="56" rx="4" className="art-fill" />
      <rect x="30" y="80" width="40" height="10" rx="4" className="art-fill" />
      <path d="M42 34 L64 22 L64 12" />
      <rect x="58" y="6" width="12" height="10" rx="2" className="art-fill" />
      <rect x="120" y="20" width="22" height="88" />
      <rect x="124" y="70" width="14" height="34" className="art-fill" />
      <line x1="50" y1="90" x2="50" y2="108" />
      {FLOOR}
    </>
  ),
  pec_deck: (
    <>
      <rect x="64" y="30" width="12" height="52" rx="4" className="art-fill" />
      <rect x="54" y="80" width="40" height="10" rx="4" className="art-fill" />
      <path d="M70 34 L36 44 L36 70" />
      <path d="M70 34 L104 44 L104 70" />
      <rect x="30" y="58" width="12" height="16" rx="3" className="art-fill" />
      <rect x="98" y="58" width="12" height="16" rx="3" className="art-fill" />
      <line x1="74" y1="90" x2="74" y2="108" />
      {FLOOR}
    </>
  ),
  pull_up_bar: (
    <>
      <line x1="30" y1="14" x2="30" y2="108" />
      <line x1="130" y1="14" x2="130" y2="108" />
      <line x1="22" y1="22" x2="138" y2="22" className="art-thick" />
      <line x1="20" y1="108" x2="40" y2="108" />
      <line x1="120" y1="108" x2="140" y2="108" />
      {FLOOR}
    </>
  ),
  dip_station: (
    <>
      <line x1="44" y1="50" x2="44" y2="108" />
      <line x1="116" y1="50" x2="116" y2="108" />
      <line x1="30" y1="50" x2="64" y2="50" className="art-thick" />
      <line x1="96" y1="50" x2="130" y2="50" className="art-thick" />
      <line x1="44" y1="80" x2="116" y2="80" className="art-thin" />
      {FLOOR}
    </>
  ),
  treadmill: (
    <>
      <path d="M14 100 L120 92 L124 102 L18 108 Z" className="art-fill" />
      <line x1="112" y1="94" x2="122" y2="34" />
      <line x1="122" y1="34" x2="98" y2="40" />
      <rect x="114" y="24" width="28" height="16" rx="3" className="art-fill" />
      {FLOOR}
    </>
  ),
  elliptical: (
    <>
      <circle cx="122" cy="88" r="16" />
      <path d="M40 98 L104 92" />
      <rect x="34" y="94" width="20" height="6" rx="2" className="art-fill" />
      <rect x="76" y="90" width="20" height="6" rx="2" className="art-fill" />
      <line x1="112" y1="76" x2="98" y2="20" />
      <line x1="98" y1="20" x2="84" y2="58" />
      <rect x="92" y="30" width="20" height="12" rx="3" className="art-fill" />
      {FLOOR}
    </>
  ),
  stationary_bike: (
    <>
      <circle cx="112" cy="86" r="18" className="art-fill" />
      <path d="M50 46 L66 96 L112 86 L100 34" />
      <rect x="38" y="40" width="26" height="8" rx="4" className="art-fill" />
      <line x1="94" y1="34" x2="116" y2="34" />
      <line x1="40" y1="108" x2="130" y2="108" />
      {FLOOR}
    </>
  ),
  stair_climber: (
    <>
      <path d="M24 108 V90 H52 V72 H80 V54 H108 V36 H128" />
      <line x1="128" y1="36" x2="128" y2="108" />
      <line x1="122" y1="14" x2="122" y2="40" />
      <rect x="112" y="10" width="26" height="12" rx="3" className="art-fill" />
      {FLOOR}
    </>
  ),
  rowing_machine: (
    <>
      <line x1="12" y1="100" x2="122" y2="88" />
      <circle cx="132" cy="80" r="16" className="art-fill" />
      <rect x="40" y="88" width="24" height="7" rx="3" className="art-fill" />
      <rect x="98" y="80" width="6" height="14" rx="1" />
      <line x1="118" y1="76" x2="94" y2="72" className="art-thin" />
      <rect x="86" y="68" width="10" height="6" rx="2" className="art-fill" />
      {FLOOR}
    </>
  ),
  air_bike: (
    <>
      <circle cx="116" cy="80" r="22" />
      <circle cx="116" cy="80" r="6" className="art-fill" />
      <path d="M52 46 L66 98 L116 80" />
      <rect x="40" y="40" width="26" height="8" rx="4" className="art-fill" />
      <line x1="96" y1="22" x2="104" y2="80" />
      {FLOOR}
    </>
  ),
  plyo_box: (
    <>
      <path d="M36 108 L48 46 L112 46 L124 108 Z" className="art-fill" />
      <line x1="48" y1="46" x2="60" y2="34" />
      <line x1="112" y1="46" x2="124" y2="34" />
      <line x1="60" y1="34" x2="124" y2="34" />
      {FLOOR}
    </>
  ),
  medicine_ball: (
    <>
      <circle cx="80" cy="74" r="32" className="art-fill" />
      <path d="M50 64 Q80 82 110 64" />
      <path d="M52 88 Q80 70 108 88" />
      {FLOOR}
    </>
  ),
  battle_ropes: (
    <>
      <rect x="128" y="88" width="16" height="20" className="art-fill" />
      <path d="M128 94 C110 70 96 110 78 86 C62 64 46 104 26 84" />
      <path d="M128 102 C110 80 96 118 78 96 C62 76 46 112 26 94" />
      {FLOOR}
    </>
  ),
  sled: (
    <>
      <path d="M30 104 L130 104 L136 98" />
      <line x1="56" y1="104" x2="56" y2="38" />
      <line x1="104" y1="104" x2="104" y2="38" />
      <rect x="66" y="66" width="28" height="34" rx="3" className="art-fill" />
      {FLOOR}
    </>
  ),
  resistance_bands: (
    <>
      <ellipse cx="62" cy="70" rx="38" ry="22" />
      <ellipse cx="98" cy="78" rx="38" ry="22" className="art-thin" />
      {FLOOR}
    </>
  ),
  suspension_trainer: (
    <>
      <line x1="40" y1="10" x2="120" y2="10" className="art-thick" />
      <circle cx="80" cy="14" r="4" />
      <path d="M80 18 L60 76" />
      <path d="M80 18 L100 76" />
      <rect x="52" y="76" width="14" height="6" rx="2" className="art-fill" />
      <rect x="94" y="76" width="14" height="6" rx="2" className="art-fill" />
      {FLOOR}
    </>
  ),
  ab_wheel: (
    <>
      <circle cx="80" cy="84" r="22" className="art-fill" />
      <line x1="44" y1="84" x2="116" y2="84" className="art-thick" />
      {FLOOR}
    </>
  ),
  stability_ball: (
    <>
      <circle cx="80" cy="70" r="38" className="art-fill" />
      <path d="M50 52 Q62 40 78 38" className="art-thin" />
      {FLOOR}
    </>
  ),
  pool: (
    <>
      <rect x="14" y="40" width="132" height="60" rx="4" />
      <path d="M22 62 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" />
      <path d="M22 80 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" className="art-thin" />
      <line x1="120" y1="40" x2="120" y2="20" />
      <line x1="132" y1="40" x2="132" y2="20" />
    </>
  ),
  court: (
    <>
      <rect x="20" y="20" width="120" height="88" />
      <line x1="20" y1="64" x2="140" y2="64" />
      <ellipse cx="62" cy="50" rx="14" ry="18" transform="rotate(-30 62 50)" />
      <line x1="70" y1="64" x2="86" y2="88" className="art-thick" />
      <circle cx="108" cy="42" r="5" className="art-fill" />
    </>
  ),
  sauna: (
    <>
      <rect x="20" y="46" width="120" height="62" />
      <line x1="20" y1="70" x2="140" y2="70" className="art-thin" />
      <line x1="20" y1="90" x2="140" y2="90" className="art-thin" />
      <path d="M50 38 q-8 -10 0 -20 t0 -16" />
      <path d="M80 38 q-8 -10 0 -20 t0 -16" />
      <path d="M110 38 q-8 -10 0 -20 t0 -16" />
    </>
  ),
};

const FALLBACK: Record<EquipmentCategory, React.ReactNode> = {
  "Free weights": DRAWINGS.dumbbells,
  "Benches and racks": DRAWINGS.flat_bench,
  "Cables and machines": (
    <>
      <rect x="40" y="30" width="12" height="52" rx="4" className="art-fill" />
      <rect x="40" y="80" width="40" height="10" rx="4" className="art-fill" />
      <rect x="114" y="18" width="24" height="90" />
      <rect x="118" y="66" width="16" height="38" className="art-fill" />
      <line x1="52" y1="40" x2="114" y2="30" className="art-thin" />
      <line x1="60" y1="90" x2="60" y2="108" />
      {FLOOR}
    </>
  ),
  Cardio: DRAWINGS.treadmill,
  Functional: DRAWINGS.plyo_box,
  Other: DRAWINGS.sauna,
};

DRAWINGS.calf_raise_machine = FALLBACK["Cables and machines"];
DRAWINGS.ab_crunch_machine = FALLBACK["Cables and machines"];
DRAWINGS.hip_abductor = FALLBACK["Cables and machines"];
DRAWINGS.assisted_pull_up = DRAWINGS.lat_pulldown;

export function EquipmentArt({
  id,
  className,
  title,
}: {
  id: string;
  className?: string;
  title?: string;
}) {
  const item = EQUIPMENT_BY_ID[id];
  const category = item?.category ?? "Other";
  const drawing = DRAWINGS[id] ?? FALLBACK[category];
  return (
    <svg
      viewBox="0 0 160 120"
      className={`art ${className ?? ""}`}
      style={{ "--art-accent": CATEGORY_COLOR[category] } as React.CSSProperties}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {drawing}
    </svg>
  );
}
