# fit^3

Workouts built from the equipment at your gym.

This version is the interface and dashboard. It runs entirely in the browser with no account, so the core flow can be tried and refined before sign-in, a shared database and the other features are added.

## What it does

1. **Setup**: age, height, weight and sex, then goal, experience, days per week, session length and movements to leave out.
2. **Gym**: pick a gym or add your own. Each gym has a synopsis, hours, amenities and a list of possible equipment.
3. **Equipment**: a game-style viewer. Tap any piece to see it, what it trains and which exercises it unlocks, and mark whether your gym has it.
4. **Workout**: choose a focus, duration, start time and goal, then generate a session that only uses your gym's equipment. Each exercise shows its start time, sets, reps, rest and how-to, and can be swapped if the equipment is taken.

Settings and the last workout are kept in the browser on that device.

## Run it

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Deploy

1. Go to https://vercel.com/new and import this repository.
2. Click **Deploy**. No settings or keys are needed for this version.

Every push to `main` publishes a new version.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run locally |
| `npm test` | Run the workout generator tests |
| `npm run typecheck` | Check types |
| `npm run lint` | Lint |
| `npm run build` | Production build |

## Where things are

| Path | Contents |
| --- | --- |
| `src/app/setup` | Body info and training preferences |
| `src/app/gym` | Gym list, synopsis and adding a gym |
| `src/app/equipment` | Equipment viewer |
| `src/app/dashboard` | Workout generator |
| `src/components/EquipmentArt.tsx` | Equipment illustrations |
| `src/lib/gyms.ts` | Gyms that ship with the app, including LA Fitness Mission Viejo |
| `src/lib/catalog.ts` | Equipment catalog, gym types and starting lists |
| `src/lib/exercises.ts` | Exercise library |
| `src/lib/generator.ts` | Session and week generation, swaps |
| `src/lib/store.ts` | Browser-held state (replaced by accounts later) |
| `supabase/schema.sql`, `src/lib/supabase.ts` | Database design for the accounts step, not used yet |

## Next steps

- Accounts and a shared database, so equipment corrections reach every member
- Journal and progress tracking
- Finding gyms through Google Maps
- Short exercise animations

## Disclaimer

Workouts are general suggestions, not medical advice.
