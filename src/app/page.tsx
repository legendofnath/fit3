"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EquipmentArt } from "@/components/EquipmentArt";
import { currentGym, useStore } from "@/lib/store";

/** Landing: returning members go straight to the dashboard. */
export default function Home() {
  const state = useStore();
  const router = useRouter();
  const ready = state.hydrated && state.body && state.prefs && currentGym(state);

  useEffect(() => {
    if (ready) router.replace("/dashboard");
  }, [ready, router]);

  if (!state.hydrated || ready) return null;

  return (
    <section className="grid items-center gap-10 py-6 md:grid-cols-[1.1fr_1fr] md:py-14">
      <div className="flex flex-col gap-6">
        <h1 className="display">
          Your gym.
          <br />
          Your equipment.
          <br />
          Your workout.
        </h1>
        <p className="lede text-lg">
          fit³ already knows what your gym has, so every workout it builds is one you can do start
          to finish. No equipment lists to fill in.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/setup" className="btn btn-go">
            Get started
          </Link>
        </div>
        <p className="muted small">Takes about a minute. Nothing to sign up for yet.</p>
      </div>
      <div
        className="stage grid grid-cols-2 gap-2 p-4"
        style={{ "--stage-glow": "var(--plate-yellow)" } as React.CSSProperties}
      >
        {["barbell", "power_rack", "cable_station", "kettlebells"].map((id) => (
          <EquipmentArt key={id} id={id} className="w-full" />
        ))}
      </div>
    </section>
  );
}
