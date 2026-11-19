import type { Style } from "./splits";
import type { Role } from "./types";

/** Why an exercise sits where it does in a session. */
export const ROLE_INFO: Record<Role, { name: string; about: string }> = {
  main: {
    name: "Main lift",
    about: "The heaviest, most important lift of the day. It goes first, while you are fresh, so you can lift with good form and push the weight up over time.",
  },
  secondary: {
    name: "Secondary lift",
    about: "A second big movement that adds work for the same muscles from a different angle, a little lighter and for a few more reps.",
  },
  accessory: {
    name: "Accessory",
    about: "Smaller, targeted work for one muscle. Higher reps and shorter rests add muscle-building volume without much fatigue.",
  },
  finisher: {
    name: "Finisher",
    about: "Conditioning at the end of the session to raise your heart rate and burn extra energy once the lifting is done.",
  },
};

/** What each training style is for, in plain language. */
export const STYLE_INFO: Record<Style, { name: string; about: string }> = {
  power: {
    name: "Power",
    about: "Very heavy, very low reps with long rests. Trains your nervous system to produce maximum force. Rest fully between sets so every rep is fast and clean.",
  },
  strength: {
    name: "Strength",
    about: "Heavy weights for 3 to 6 reps on the main lifts. Long rests let you lift close to your best on every set, which is what drives strength up.",
  },
  hypertrophy: {
    name: "Muscle building",
    about: "Moderate weights for 6 to 15 reps, taken close to failure. Total hard sets per muscle each week matter most for growth.",
  },
  conditioning: {
    name: "Conditioning",
    about: "Lighter weights, higher reps and short rests keep your heart rate up. You burn more energy while still keeping, and building, muscle.",
  },
};

/** Short guides for the Learn screen. Each has a title and a few paragraphs. */
export const GUIDES: { title: string; body: string[] }[] = [
  {
    title: "Progressive overload",
    body: [
      "Muscles and strength only grow when the work gets a little harder over time. fit³ tracks every set you log and raises your target weight when you hit the top of the rep range on every set.",
      "If you miss the range, keep the same weight next time. Adding reps before adding weight is still progress.",
    ],
  },
  {
    title: "How hard each set should be",
    body: [
      "Most sets should end with one to three reps left in the tank: hard, but with clean form. That is close enough to failure to make progress without beating you up.",
      "Save true failure for the last set of an accessory, never for heavy squats, deadlifts or presses.",
    ],
  },
  {
    title: "Warming up",
    body: [
      "Five minutes of easy cardio raises your body temperature. Then do two or three lighter sets of your first lift, building up to your working weight.",
      "Later exercises need less warm-up because the muscles are already working.",
    ],
  },
  {
    title: "Recovery",
    body: [
      "A muscle usually needs about 48 hours to recover from hard training. fit³ checks when you last trained each muscle and suggests a different day if it is still recovering.",
      "Sleep, enough protein and total food intake affect recovery more than any exercise choice.",
    ],
  },
  {
    title: "Weekly sets",
    body: [
      "A hard set is one taken close to failure. For muscle growth, a common recommendation is about 10 to 20 hard sets per muscle per week, spread over two or more sessions.",
      "For strength, fewer, heavier sets on the main lifts are enough. The dashboard shows your sets per muscle for the last 7 days against the range for your goal.",
    ],
  },
  {
    title: "When to stop",
    body: [
      "Sharp pain, pain in a joint, dizziness or chest pain mean stop the exercise. Muscle burn and normal fatigue are fine.",
      "fit³ gives general training suggestions, not medical advice. Check with a doctor before starting if you have an injury or a health condition.",
    ],
  },
];
