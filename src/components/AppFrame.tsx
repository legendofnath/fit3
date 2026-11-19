"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { currentGym, useStore } from "@/lib/store";

const LINKS = [
  { href: "/dashboard", label: "Workout" },
  { href: "/equipment", label: "Equipment" },
  { href: "/gym", label: "Gym" },
  { href: "/setup", label: "Profile" },
];

export function Logo() {
  return (
    <span className="display text-3xl" aria-label="fit cubed">
      fit<sup className="text-xl" style={{ color: "var(--plate-yellow)" }}>3</sup>
    </span>
  );
}

/** Top bar once setup is done; the setup flow shows only the logo. */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const state = useStore();
  const ready = state.hydrated && state.body && state.prefs && currentGym(state);
  const showNav = ready && pathname !== "/";

  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 pt-4">
        <Link href={ready ? "/dashboard" : "/"} className="shrink-0">
          <Logo />
        </Link>
        {showNav && (
          <nav aria-label="Main" className="hidden sm:block">
            <ul className="flex gap-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="nav-link"
                    aria-current={pathname === link.href ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main className={`mx-auto w-full max-w-6xl flex-1 px-5 pt-6 ${showNav ? "pb-28 sm:pb-12" : "pb-12"}`}>
        {children}
      </main>

      {showNav && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 border-t sm:hidden"
          style={{ background: "var(--iron)", borderColor: "var(--edge)" }}
        >
          <ul className="flex justify-around px-2 py-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav-link"
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
