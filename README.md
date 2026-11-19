# fit^3

Workouts built from the equipment at your gym.

This version is the interface and dashboard. It runs entirely in the browser with no account, so the core flow can be tried and refined before sign-in, a shared database and the other features are added.

## What it does

1. **Setup**: age, height, weight and sex, then goal, experience, days per week, session length and movements to leave out.
2. **Gym**: pick a gym or add your own. Each gym has a synopsis, hours, amenities and a list of possible equipment.
3. **Equipment**: a game-style viewer. Tap any piece to see it, what it trains and which exercises it unlocks, and mark whether your gym has it.
4. **Workout**: pick a training split (11 options, from full body and 5×5 to push/pull/legs, Arnold and body-part splits). fit³ recommends the next day from your rotation and from which muscles have recovered. Build the session, log each set's weight and reps, and finish it to archive it.
5. **History**: every finished workout, with sets, time, weight moved and calories, and a chart of weight moved per workout.
6. **Learn**: how workouts are built, sets and reps by goal, every split explained, training guides and the full exercise library with how-to and common mistakes.

The dashboard shows workouts this week, gym days and weight moved over 30 days, calories, your weekly streak, and hard sets per muscle for the last 7 days against the range for your goal.

## How workouts are generated

1. The split decides the day; each day is a list of slots (for example "main horizontal press" or "side-delt accessory").
2. For each slot, every exercise the gym supports is scored: standard choices score highest, the right tier for the slot scores higher, recently used exercises lose points, two very draining lifts in one session are avoided, and a seeded tie-break adds variety.
3. Sets, reps and rest come from the exercise's role (main, secondary, accessory, finisher) and the training style, limited to the rep range each exercise suits.
4. If the session is too long, accessories go first, then sets are trimmed; main lifts stay.
5. Target weights come from your logged results: hit the top of the range on every set and the target goes up.

The logic lives in `src/lib/generator.ts`, `src/lib/splits.ts` and `src/lib/history.ts`, with tests in `tests/generator.test.ts`.

Settings, workouts and history are kept in the browser on that device.

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
| `src/app/dashboard` | Workout builder, set logging and statistics |
| `src/app/history` | Finished workouts |
| `src/app/learn` | Training education and exercise library |
| `src/lib/splits.ts` | Training splits and their day templates |
| `src/lib/history.ts` | Workout log, statistics, recovery and next-day recommendation |
| `src/components/EquipmentArt.tsx` | Equipment illustrations |
| `src/lib/gyms.ts` | Gyms that ship with the app, including LA Fitness Mission Viejo |
| `src/lib/catalog.ts` | Equipment catalog, gym types and starting lists |
| `src/lib/exercises.ts` | Exercise library |
| `src/lib/generator.ts` | Scored exercise selection, prescriptions, time fitting, swaps |
| `src/lib/store.ts` | Browser-held state (replaced by accounts later) |
| `supabase/schema.sql`, `src/lib/supabase.ts` | Database design for the accounts step, not used yet |

## Next steps

- Accounts and a shared database, so equipment corrections reach every member
- Per-exercise progress charts
- Finding gyms through Google Maps
- Short exercise animations

## Disclaimer

Workouts are general suggestions, not medical advice.
