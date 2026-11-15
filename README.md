# fit^3

Workouts generated from the equipment at your gym, with a community-edited equipment list and a training journal.

The design and the decisions behind it are in the concept brief. This repository is the first version, which covers the six core functions:

1. Account and training profile (goal, experience, days per week, session length, movements to leave out)
2. Gym selection, with a starting equipment list based on the gym's type
3. Equipment list that any member can add to or correct, with a change history
4. Workout generator for up to one week, using only equipment the gym has
5. One-tap swaps for "equipment is taken" and "this gym doesn't have it"
6. Journal that records sets, reps and weight and sets the next target

## Not in this version

- Finding gyms through Google Maps. Gyms are added by name and address for now.
- Virtual walkthrough, photo identification, exercise animations, and sharing.
- AI-written explanations. The generator is rule-based.
- Full offline use. The current week's plan is cached on the device for reading; logging sets needs a connection.
- Custom equipment in workouts. Members can add custom items to a gym, but no exercises use them yet.

## Set up

You need Node.js 20 or newer and a free Supabase project.

1. Create a project at https://supabase.com/dashboard.
2. In the project, open **SQL Editor**, paste the contents of `supabase/schema.sql`, and run it.
3. Open **Project Settings**, then **API**, and copy the project URL and the `anon` key.
4. In this folder, run:

   ```bash
   cp .env.example .env.local
   ```

5. Open `.env.local` and paste the two values.
6. Run:

   ```bash
   npm install
   npm run dev
   ```

7. Open http://localhost:3000 and create an account.

By default Supabase emails a confirmation link at sign-up. For local testing you can turn that off under **Authentication**, **Sign In / Providers**, **Email**.

## Deploy

1. Import this repository at https://vercel.com/new.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under **Environment Variables**.
3. Deploy. Every push to `main` publishes a new version.
4. In Supabase, under **Authentication**, **URL Configuration**, set the site URL to your Vercel address.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run locally |
| `npm test` | Run the generator tests |
| `npm run typecheck` | Check types |
| `npm run lint` | Lint |
| `npm run build` | Production build |

## Where things are

| Path | Contents |
| --- | --- |
| `src/lib/catalog.ts` | Equipment catalog, gym types, and baseline lists |
| `src/lib/exercises.ts` | Exercise library |
| `src/lib/generator.ts` | Week generation, swaps, plan repair, next targets |
| `src/app` | Screens: workout, gym, journal, profile |
| `supabase/schema.sql` | Tables, row-level security, and the controlled write functions |
| `tests` | Generator tests |

## Security notes

- Never commit `.env.local` or any key. `.gitignore` already excludes it.
- Never use the Supabase `service_role` key in this app.
- Profiles, plans and journals are readable only by their owner (row-level security).
- Equipment edits go through one database function that records each change and limits an account to 30 per day.

## Disclaimer

Workouts are general suggestions, not medical advice. Members must be 18 or older.
