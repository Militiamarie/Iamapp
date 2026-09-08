import { fateOfIntent } from "@/lib/sigil";
import { cn } from "@/lib/utils";

export function IntentFire({ intent }: { intent: string }) {
  const glyphs = fateOfIntent(intent);
  if (!intent.trim()) {
    return (
      <p className="font-display text-xl tracking-[0.2em] text-ash uppercase">
        Write the vow
      </p>
    );
  }
  return (
    <p
      className="flex flex-wrap gap-y-1 font-display text-2xl leading-tight tracking-[0.18em] uppercase sm:text-3xl"
      aria-hidden="true"
    >
      {glyphs.map((g, i) => (
        <span
          key={`${g.ch}-${i}`}
          className={cn(
            g.fate === "kept" && "foil-text",
            g.fate === "vowel" && "letter-burn",
            g.fate === "dup" &&
              "text-ash/30 line-through decoration-magenta/40",
            g.fate === "mark" && "inline-block w-2 text-ash/40",
          )}
        >
          {g.fate === "mark" && g.ch === " " ? "\u00a0" : g.ch}
        </span>
      ))}
    </p>
  );
}
