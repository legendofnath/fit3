import type { AvoidTag, Exercise, Kind, Movement, Muscle } from "./types";

function x(
  id: string,
  name: string,
  requires: string[],
  muscle: Muscle,
  movement: Movement,
  kind: Kind,
  difficulty: 1 | 2 | 3,
  avoid: AvoidTag[],
  cues: string,
): Exercise {
  return { id, name, requires, muscle, movement, kind, difficulty, avoid, cues };
}

/** The exercise library. Written for fit^3; extend it by adding rows. */
export const EXERCISES: Exercise[] = [
  // Chest
  x("barbell_bench_press", "Barbell bench press", ["barbell", "flat_bench"], "chest", "push", "compound", 2, [], "Shoulder blades pinched back. Lower the bar to mid-chest, press up and slightly back."),
  x("incline_barbell_press", "Incline barbell press", ["barbell", "adjustable_bench"], "chest", "push", "compound", 2, [], "Bench at about 30 degrees. Lower to the upper chest."),
  x("dumbbell_bench_press", "Dumbbell bench press", ["dumbbells", "flat_bench"], "chest", "push", "compound", 1, [], "Elbows about 45 degrees from your sides. Press up until the dumbbells nearly touch."),
  x("incline_dumbbell_press", "Incline dumbbell press", ["dumbbells", "adjustable_bench"], "chest", "push", "compound", 1, [], "Bench at about 30 degrees. Control the way down."),
  x("machine_chest_press", "Machine chest press", ["chest_press_machine"], "chest", "push", "compound", 1, [], "Set the seat so the handles line up with mid-chest. Press without locking out hard."),
  x("smith_bench_press", "Smith machine bench press", ["smith_machine", "flat_bench"], "chest", "push", "compound", 1, [], "Centre the bench so the bar meets mid-chest."),
  x("push_up", "Push-up", [], "chest", "push", "compound", 1, [], "Body in one straight line. Chest to just above the floor. Drop to your knees to make it easier."),
  x("dip", "Dip", ["dip_station"], "chest", "push", "compound", 2, [], "Lean slightly forward. Lower until your upper arms are about parallel to the floor."),
  x("pec_deck_fly", "Pec deck fly", ["pec_deck"], "chest", "push", "isolation", 1, [], "Slight bend in the elbows. Squeeze the handles together, return slowly."),
  x("cable_fly", "Cable fly", ["cable_station"], "chest", "push", "isolation", 1, [], "Pulleys at shoulder height. Bring your hands together in a hugging arc."),
  x("dumbbell_fly", "Dumbbell fly", ["dumbbells", "flat_bench"], "chest", "push", "isolation", 2, [], "Light weight. Open wide with a soft elbow bend, stop when you feel a stretch."),

  // Back
  x("pull_up", "Pull-up", ["pull_up_bar"], "back", "pull", "compound", 2, [], "Start from a full hang. Pull your chest toward the bar."),
  x("assisted_pull_up", "Assisted pull-up", ["assisted_pull_up"], "back", "pull", "compound", 1, [], "Pick assistance that lets you hit the rep range. Full hang at the bottom."),
  x("lat_pulldown", "Lat pulldown", ["lat_pulldown"], "back", "pull", "compound", 1, [], "Pull the bar to your upper chest. Do not lean far back."),
  x("barbell_row", "Barbell row", ["barbell"], "back", "pull", "compound", 2, ["spinal_load"], "Hinge forward with a flat back. Pull the bar to your lower ribs."),
  x("dumbbell_row", "One-arm dumbbell row", ["dumbbells", "flat_bench"], "back", "pull", "compound", 1, [], "Hand and knee on the bench. Pull the dumbbell to your hip."),
  x("seated_cable_row", "Seated cable row", ["seated_cable_row"], "back", "pull", "compound", 1, [], "Sit tall. Pull the handle to your stomach, squeeze your shoulder blades."),
  x("standing_cable_row", "Standing cable row", ["cable_station"], "back", "pull", "compound", 1, [], "Pulley at chest height. Stay upright and pull your elbows back."),
  x("inverted_row", "Inverted row", ["smith_machine"], "back", "pull", "compound", 1, [], "Bar at waist height. Hang under it with a straight body and pull your chest to the bar."),
  x("suspension_row", "Suspension strap row", ["suspension_trainer"], "back", "pull", "compound", 1, [], "Lean back with straight arms. Pull your chest to your hands. Walk your feet forward to make it harder."),
  x("kettlebell_row", "Kettlebell row", ["kettlebells"], "back", "pull", "compound", 1, [], "Hinge forward, flat back. Pull the kettlebell to your hip."),
  x("straight_arm_pulldown", "Straight-arm pulldown", ["cable_station"], "back", "pull", "isolation", 1, [], "Arms nearly straight. Sweep the bar from eye level to your thighs."),
  x("prone_y_raise", "Prone Y raise", [], "back", "pull", "isolation", 1, [], "Lie face down. Lift your arms in a Y shape with thumbs up, hold for a second."),

  // Shoulders
  x("overhead_press", "Barbell overhead press", ["barbell"], "shoulders", "push", "compound", 2, ["overhead", "spinal_load"], "Squeeze your glutes. Press the bar straight up past your face to lockout."),
  x("dumbbell_shoulder_press", "Dumbbell shoulder press", ["dumbbells"], "shoulders", "push", "compound", 1, ["overhead"], "Seated or standing. Press up until your arms are straight, lower to ear height."),
  x("machine_shoulder_press", "Machine shoulder press", ["shoulder_press_machine"], "shoulders", "push", "compound", 1, ["overhead"], "Seat height so the handles start at shoulder level."),
  x("kettlebell_press", "Kettlebell press", ["kettlebells"], "shoulders", "push", "compound", 2, ["overhead"], "Kettlebell resting on your forearm. Press straight up, one arm at a time."),
  x("landmine_press", "Landmine press", ["landmine", "barbell"], "shoulders", "push", "compound", 1, [], "Hold the end of the bar at your shoulder. Press up and forward."),
  x("pike_push_up", "Pike push-up", [], "shoulders", "push", "compound", 2, ["overhead"], "Hips high in an upside-down V. Lower the top of your head toward the floor."),
  x("lateral_raise", "Dumbbell lateral raise", ["dumbbells"], "shoulders", "push", "isolation", 1, [], "Raise to shoulder height with a soft elbow bend. No swinging."),
  x("cable_lateral_raise", "Cable lateral raise", ["cable_station"], "shoulders", "push", "isolation", 1, [], "Pulley at the bottom. Raise across your body to shoulder height."),
  x("face_pull", "Face pull", ["cable_station"], "shoulders", "pull", "isolation", 1, [], "Rope at face height. Pull toward your eyes with elbows high."),
  x("rear_delt_fly", "Rear delt fly", ["dumbbells"], "shoulders", "pull", "isolation", 1, [], "Hinge forward. Raise the dumbbells out to the sides."),
  x("reverse_pec_deck", "Reverse pec deck", ["pec_deck"], "shoulders", "pull", "isolation", 1, [], "Face the pad. Open your arms back until they are in line with your shoulders."),
  x("band_pull_apart", "Band pull-apart", ["resistance_bands"], "shoulders", "pull", "isolation", 1, [], "Arms straight in front. Pull the band apart to your chest."),

  // Biceps
  x("dumbbell_curl", "Dumbbell curl", ["dumbbells"], "biceps", "pull", "isolation", 1, [], "Elbows pinned to your sides. Curl up, lower slowly."),
  x("hammer_curl", "Hammer curl", ["dumbbells"], "biceps", "pull", "isolation", 1, [], "Palms face each other the whole way."),
  x("barbell_curl", "Barbell curl", ["barbell"], "biceps", "pull", "isolation", 1, [], "Shoulder-width grip. Do not lean back."),
  x("ez_bar_curl", "EZ bar curl", ["ez_bar"], "biceps", "pull", "isolation", 1, [], "Grip the angled part of the bar. Elbows stay still."),
  x("cable_curl", "Cable curl", ["cable_station"], "biceps", "pull", "isolation", 1, [], "Pulley at the bottom. Curl the bar to your chest."),
  x("preacher_curl", "Preacher curl", ["preacher_bench", "ez_bar"], "biceps", "pull", "isolation", 1, [], "Upper arms flat on the pad. Do not drop into the bottom."),
  x("band_curl", "Band curl", ["resistance_bands"], "biceps", "pull", "isolation", 1, [], "Stand on the band. Curl both ends up."),
  x("kettlebell_curl", "Kettlebell curl", ["kettlebells"], "biceps", "pull", "isolation", 1, [], "Hold one kettlebell by the horns. Curl to your chest."),

  // Triceps
  x("cable_pushdown", "Cable pushdown", ["cable_station"], "triceps", "push", "isolation", 1, [], "Elbows at your sides. Push down until your arms are straight."),
  x("overhead_dumbbell_extension", "Overhead dumbbell extension", ["dumbbells"], "triceps", "push", "isolation", 1, ["overhead"], "One dumbbell in both hands. Lower it behind your head, extend up."),
  x("skull_crusher", "Skull crusher", ["ez_bar", "flat_bench"], "triceps", "push", "isolation", 2, [], "Lower the bar toward your forehead by bending only at the elbows."),
  x("dumbbell_kickback", "Dumbbell kickback", ["dumbbells"], "triceps", "push", "isolation", 1, [], "Hinge forward, upper arm level with your back. Straighten the elbow."),
  x("bench_dip", "Bench dip", ["flat_bench"], "triceps", "push", "isolation", 1, [], "Hands on the bench behind you. Lower until your elbows reach 90 degrees."),
  x("close_grip_push_up", "Close-grip push-up", [], "triceps", "push", "isolation", 1, [], "Hands under your shoulders, elbows tight to your ribs."),

  // Quads
  x("back_squat", "Barbell back squat", ["barbell", "power_rack"], "quads", "squat", "compound", 2, ["spinal_load", "deep_knee"], "Bar on your upper back. Sit down between your hips until your thighs are parallel."),
  x("front_squat", "Barbell front squat", ["barbell", "power_rack"], "quads", "squat", "compound", 3, ["spinal_load", "deep_knee"], "Bar on the front of your shoulders, elbows high. Stay upright."),
  x("goblet_squat", "Goblet squat", ["dumbbells"], "quads", "squat", "compound", 1, ["deep_knee"], "Hold one dumbbell at your chest. Squat between your knees."),
  x("kettlebell_goblet_squat", "Kettlebell goblet squat", ["kettlebells"], "quads", "squat", "compound", 1, ["deep_knee"], "Hold the kettlebell by the horns at your chest."),
  x("leg_press", "Leg press", ["leg_press"], "quads", "squat", "compound", 1, [], "Feet shoulder width. Lower until your knees reach about 90 degrees. Do not lock out hard."),
  x("hack_squat", "Hack squat", ["hack_squat"], "quads", "squat", "compound", 2, ["deep_knee"], "Back flat on the pad. Lower under control."),
  x("smith_squat", "Smith machine squat", ["smith_machine"], "quads", "squat", "compound", 1, ["deep_knee"], "Feet slightly in front of the bar. Squat to parallel."),
  x("bodyweight_squat", "Bodyweight squat", [], "quads", "squat", "compound", 1, ["deep_knee"], "Arms out front for balance. Sit back and down to parallel."),
  x("dumbbell_lunge", "Dumbbell lunge", ["dumbbells"], "quads", "squat", "compound", 1, [], "Step forward and lower your back knee toward the floor. Alternate legs."),
  x("walking_lunge", "Walking lunge", [], "quads", "squat", "compound", 1, [], "Long steps. Front knee over your ankle."),
  x("bulgarian_split_squat", "Bulgarian split squat", ["dumbbells", "flat_bench"], "quads", "squat", "compound", 2, ["deep_knee"], "Back foot on the bench. Lower straight down."),
  x("step_up", "Step-up", ["plyo_box"], "quads", "squat", "compound", 1, [], "Drive through the whole foot on the box. Step down under control."),
  x("box_jump", "Box jump", ["plyo_box"], "quads", "squat", "compound", 2, ["jumping"], "Land softly with bent knees. Step down, do not jump down."),
  x("leg_extension", "Leg extension", ["leg_extension"], "quads", "squat", "isolation", 1, [], "Pad on your lower shin. Straighten your legs and pause at the top."),
  x("wall_sit", "Wall sit", [], "quads", "squat", "isolation", 1, [], "Back against a wall, thighs parallel. Hold. Count each 5 seconds as one rep."),

  // Hamstrings and glutes
  x("deadlift", "Barbell deadlift", ["barbell"], "hamstrings", "hinge", "compound", 2, ["spinal_load"], "Bar over mid-foot. Flat back. Push the floor away and stand tall."),
  x("romanian_deadlift", "Romanian deadlift", ["barbell"], "hamstrings", "hinge", "compound", 2, ["spinal_load"], "Soft knees. Push your hips back and slide the bar down your thighs to mid-shin."),
  x("dumbbell_rdl", "Dumbbell Romanian deadlift", ["dumbbells"], "hamstrings", "hinge", "compound", 1, [], "Push your hips back with a flat back until you feel your hamstrings stretch."),
  x("trap_bar_deadlift", "Trap bar deadlift", ["trap_bar"], "hamstrings", "hinge", "compound", 1, ["spinal_load"], "Stand inside the bar. Chest up, push through your whole foot."),
  x("kettlebell_swing", "Kettlebell swing", ["kettlebells"], "glutes", "hinge", "compound", 2, [], "Hike the kettlebell back, snap your hips forward. Arms only guide it."),
  x("kettlebell_deadlift", "Kettlebell deadlift", ["kettlebells"], "hamstrings", "hinge", "compound", 1, [], "Kettlebell between your feet. Hinge down with a flat back and stand."),
  x("hip_thrust", "Barbell hip thrust", ["barbell", "flat_bench"], "glutes", "hinge", "compound", 1, [], "Upper back on the bench, bar over your hips. Drive up and squeeze at the top."),
  x("glute_bridge", "Glute bridge", [], "glutes", "hinge", "compound", 1, [], "Lie on your back, feet flat. Lift your hips until your body is straight."),
  x("cable_pull_through", "Cable pull-through", ["cable_station"], "glutes", "hinge", "compound", 1, [], "Face away, rope between your legs. Hinge back, then drive your hips forward."),
  x("back_extension", "Back extension", ["back_extension"], "glutes", "hinge", "isolation", 1, [], "Hinge at the hips with a straight back. Rise until your body is in line."),
  x("leg_curl", "Leg curl", ["leg_curl"], "hamstrings", "hinge", "isolation", 1, [], "Curl the pad toward your glutes. Lower slowly."),
  x("stability_ball_curl", "Stability ball leg curl", ["stability_ball"], "hamstrings", "hinge", "isolation", 2, [], "Heels on the ball, hips up. Pull the ball toward you."),
  x("single_leg_glute_bridge", "Single-leg glute bridge", [], "hamstrings", "hinge", "isolation", 1, [], "One foot on the floor, other leg straight. Lift your hips level."),

  // Calves
  x("machine_calf_raise", "Machine calf raise", ["calf_raise_machine"], "calves", "push", "isolation", 1, [], "Full stretch at the bottom, pause at the top."),
  x("leg_press_calf_raise", "Leg press calf raise", ["leg_press"], "calves", "push", "isolation", 1, [], "Balls of your feet on the bottom edge of the plate. Push through your toes."),
  x("dumbbell_calf_raise", "Dumbbell calf raise", ["dumbbells"], "calves", "push", "isolation", 1, [], "Stand tall holding dumbbells. Rise onto your toes."),
  x("smith_calf_raise", "Smith machine calf raise", ["smith_machine"], "calves", "push", "isolation", 1, [], "Bar on your upper back. Rise onto your toes."),
  x("bodyweight_calf_raise", "Bodyweight calf raise", [], "calves", "push", "isolation", 1, [], "On a step edge if you can. One leg at a time to make it harder."),

  // Core
  x("plank", "Plank", [], "core", "core", "isolation", 1, [], "Elbows under shoulders, body straight. Count each 5 seconds as one rep."),
  x("side_plank", "Side plank", [], "core", "core", "isolation", 1, [], "Elbow under shoulder, hips high. Count each 5 seconds as one rep, both sides."),
  x("dead_bug", "Dead bug", [], "core", "core", "isolation", 1, [], "Lower back pressed down. Extend the opposite arm and leg slowly."),
  x("bicycle_crunch", "Bicycle crunch", [], "core", "core", "isolation", 1, [], "Elbow toward the opposite knee. Slow and controlled."),
  x("hanging_knee_raise", "Hanging knee raise", ["pull_up_bar"], "core", "core", "isolation", 2, [], "Hang from the bar. Bring your knees to your chest without swinging."),
  x("cable_crunch", "Cable crunch", ["cable_station"], "core", "core", "isolation", 1, [], "Kneel under the rope. Curl your ribs toward your hips."),
  x("pallof_press", "Pallof press", ["cable_station"], "core", "core", "isolation", 1, [], "Side-on to the pulley. Press the handle straight out and resist the twist."),
  x("machine_crunch", "Machine crunch", ["ab_crunch_machine"], "core", "core", "isolation", 1, [], "Curl forward using your abs, not your arms."),
  x("ab_wheel_rollout", "Ab wheel rollout", ["ab_wheel"], "core", "core", "isolation", 2, [], "From your knees. Roll out as far as you can keep your lower back flat."),
  x("russian_twist", "Medicine ball Russian twist", ["medicine_ball"], "core", "core", "isolation", 1, [], "Lean back slightly. Rotate the ball side to side."),

  // Cardio
  x("treadmill_incline_walk", "Treadmill incline walk", ["treadmill"], "cardio", "cardio", "cardio", 1, [], "Brisk pace at a moderate incline. You should be able to talk in short sentences."),
  x("treadmill_intervals", "Treadmill intervals", ["treadmill"], "cardio", "cardio", "cardio", 2, [], "One minute fast, one minute easy. Repeat."),
  x("bike_intervals", "Bike intervals", ["stationary_bike"], "cardio", "cardio", "cardio", 1, [], "Thirty seconds hard, sixty seconds easy. Repeat."),
  x("elliptical_steady", "Elliptical", ["elliptical"], "cardio", "cardio", "cardio", 1, [], "Steady effort you could hold for the whole time."),
  x("stair_climb", "Stair climber", ["stair_climber"], "cardio", "cardio", "cardio", 1, [], "Steady pace. Light hands on the rails."),
  x("rowing_intervals", "Rowing intervals", ["rowing_machine"], "cardio", "cardio", "cardio", 1, [], "Push with your legs first, then pull. One minute hard, one minute easy."),
  x("air_bike_sprints", "Air bike sprints", ["air_bike"], "cardio", "cardio", "cardio", 2, [], "Twenty seconds all out, forty seconds easy."),
  x("battle_rope_waves", "Battle rope waves", ["battle_ropes"], "cardio", "cardio", "cardio", 1, [], "Twenty seconds of waves, forty seconds rest."),
  x("sled_push", "Sled push", ["sled"], "cardio", "cardio", "cardio", 1, [], "Lean in with straight arms. Short, powerful steps."),
  x("bodyweight_circuit", "Bodyweight circuit", [], "cardio", "cardio", "cardio", 1, ["jumping"], "Jumping jacks, mountain climbers and high knees, thirty seconds each. Repeat."),
  x("brisk_walk", "Brisk walk", [], "cardio", "cardio", "cardio", 1, [], "Walk fast enough to raise your breathing. Outside or around the gym floor."),
];

export const EXERCISES_BY_ID: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((ex) => [ex.id, ex]),
);
