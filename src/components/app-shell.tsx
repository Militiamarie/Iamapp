import { useEffect } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Download,
  Flame,
  Landmark,
  LayoutGrid,
  Library,
  Newspaper,
  ScanLine,
  Stamp,
  UserRound,
} from "lucide-react";
import { Toaster } from "sonner";
import { DripVeil } from "@/components/drip-veil";
import { HouseFooter } from "@/components/house-footer";
import { InstallPrompt } from "@/components/install-prompt";
import { NowPlaying } from "@/components/now-playing";
import { WalletButton } from "@/components/wallet-button";
import { usePlayer } from "@/lib/player";
import { hydrateIam } from "@/lib/store";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { to: "/", label: "Temple", icon: Landmark },
  { to: "/house", label: "House", icon: UserRound },
  { to: "/feed", label: "Feed", icon: Newspaper },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/market", label: "Market", icon: LayoutGrid },
] as const;

const DESKTOP = [
  ...PRIMARY,
  { to: "/altar", label: "Altar", icon: Flame },
  { to: "/grimoire", label: "Grimoire", icon: BookOpen },
  { to: "/vault", label: "Vault", icon: Library },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const playing = usePlayer((s) => Boolean(s.current));

  useEffect(() => {
    hydrateIam();
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js");
  }, []);

  return (
    <div className="relative min-h-dvh bg-void text-ivory">
      <div className="grain" />
      <DripVeil />
      <header className="sticky top-0 z-20 border-b border-border bg-void/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/art/emblem.jpg"
              alt=""
              className="size-8 rounded-full object-cover sm:size-9"
            />
            <span className="foil-text font-display text-lg tracking-[0.28em] sm:text-xl">
              I AM
            </span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {DESKTOP.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                label={item.label}
                active={
                  item.to === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.to)
                }
              />
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/install"
              aria-label="Get the app"
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-md text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent)] transition-colors duration-(--motion-quick) hover:bg-gold/10 sm:h-11 sm:w-auto sm:px-3 sm:text-xs sm:font-medium sm:uppercase sm:tracking-[0.14em]",
                pathname.startsWith("/install") && "bg-gold/10",
              )}
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Get app</span>
            </Link>
            <Link
              to="/mint"
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs font-medium uppercase tracking-[0.14em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_55%,transparent)] transition-colors duration-(--motion-quick) hover:bg-gold/10",
                pathname.startsWith("/mint") && "bg-gold/10",
              )}
            >
              <Stamp className="size-3.5" />
              Studio
            </Link>
            <WalletButton />
          </div>
        </div>
      </header>

      <InstallPrompt />

      <main
        className={cn(
          "relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6",
          playing ? "pb-48 sm:pb-36" : "pb-6 sm:pb-10",
        )}
      >
        <Outlet />
      </main>

      <HouseFooter />
      <NowPlaying />

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-void/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <ul className="grid grid-cols-5">
          {PRIMARY.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-xs uppercase tracking-[0.14em]",
                    active ? "text-gold" : "text-ash",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.7} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          classNames: {
            toast:
              "bg-surface text-ivory border-0 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_35%,transparent)] font-sans",
            title: "text-ivory",
          },
        }}
      />
    </div>
  );
}

function NavLink({
  to,
  label,
  active,
}: {
  to: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex min-h-11 items-center px-3 text-xs uppercase tracking-[0.16em] transition-colors duration-(--motion-quick)",
        active ? "text-gold" : "text-ash hover:text-ivory",
      )}
    >
      {label}
    </Link>
  );
}
