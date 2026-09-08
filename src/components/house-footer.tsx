import { Link } from "@tanstack/react-router";
import { HOUSE } from "@/lib/site";

const LINKS = [
  { to: "/install" as const, label: "Get the app" },
  { to: "/support" as const, label: "Support" },
  { to: "/privacy" as const, label: "Privacy" },
  { to: "/terms" as const, label: "Terms" },
];

export function HouseFooter() {
  return (
    <footer className="relative z-10 border-t border-border pb-24 lg:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ash">
          {HOUSE.name} · {HOUSE.artist}
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="inline-flex min-h-11 items-center text-[0.65rem] uppercase tracking-[0.16em] text-ash hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={HOUSE.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-[0.65rem] uppercase tracking-[0.16em] text-ash hover:text-gold"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
