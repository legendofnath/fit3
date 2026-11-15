"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/app";
import { configured } from "@/lib/supabase";
import { AuthForm } from "./AuthForm";
import { GymPicker } from "./GymPicker";
import { ProfileForm } from "./ProfileForm";

const TABS = [
  { href: "/", label: "Workout" },
  { href: "/gym", label: "Gym" },
  { href: "/journal", label: "Journal" },
  { href: "/profile", label: "Profile" },
];

/** Gates every screen: setup notice, sign-in, profile, gym, then the app with its tab bar. */
export function Shell({ children }: { children: React.ReactNode }) {
  const { ready, userId, profile, gym } = useApp();
  const pathname = usePathname();

  if (!configured) {
    return (
      <main className="mx-auto max-w-md p-5">
        <h1>
          fit<sup>3</sup> is not connected yet
        </h1>
        <p className="muted mt-3">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart. The README
          has the steps.
        </p>
      </main>
    );
  }
  if (!ready) return <main className="muted p-5">Loading…</main>;
  if (!userId) return <AuthForm />;

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-xl p-5">
        <h1>Set up your training</h1>
        <p className="muted mb-5 mt-1">This shapes every workout. You can change it later.</p>
        <ProfileForm />
      </main>
    );
  }

  if (!gym) {
    return (
      <main className="mx-auto w-full max-w-xl p-5">
        <h1>Where do you train?</h1>
        <p className="muted mb-5 mt-1">Your workouts will only use equipment this gym has.</p>
        <GymPicker />
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-xl flex-1 p-5 pb-28">{children}</main>
      <nav
        className="fixed inset-x-0 bottom-0 border-t"
        style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        aria-label="Main"
      >
        <ul className="mx-auto flex max-w-xl">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className="flex min-h-14 items-center justify-center text-sm font-semibold"
                  style={{ color: active ? "var(--accent)" : "var(--muted)" }}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
