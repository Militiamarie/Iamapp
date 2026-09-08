import type { ReactNode } from "react";

export function LegalDoc({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <article className="pt-6 sm:pt-10">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
        {kicker}
      </p>
      <h1 className="mt-1 text-3xl text-ivory uppercase sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-xl text-sm text-ash">{lede}</p>
      <div className="mt-8 max-w-2xl space-y-6 text-sm leading-relaxed text-ash">
        {children}
      </div>
    </article>
  );
}

export function LegalH({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-lg tracking-[0.08em] text-ivory uppercase">
      {children}
    </h2>
  );
}
