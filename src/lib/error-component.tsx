import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-void px-6 text-center text-ivory">
      <span className="text-magenta" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={1.7} />
      </span>
      <h1 className="font-display text-lg tracking-[0.12em] uppercase">
        The nave snagged
      </h1>
      <p className="max-w-md text-sm break-words text-ash">
        {error instanceof Error
          ? error.message
          : "An unexpected error occurred. Try reloading."}
      </p>
      <a
        href="/"
        className="mt-2 inline-flex min-h-11 items-center text-xs uppercase tracking-[0.16em] text-gold"
      >
        Return to temple
      </a>
    </main>
  );
}

export function AppNotFound() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
        404
      </p>
      <h1 className="font-display text-2xl tracking-[0.12em] text-ivory uppercase">
        Door is sealed
      </h1>
      <p className="max-w-md text-sm text-ash">That room is not in the house.</p>
      <Link
        to="/"
        className="mt-2 inline-flex min-h-11 items-center text-xs uppercase tracking-[0.16em] text-gold"
      >
        Return to temple
      </Link>
    </main>
  );
}
