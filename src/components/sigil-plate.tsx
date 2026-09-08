import { SigilMark } from "@/components/sigil-mark";
import { plateFor } from "@/lib/sigil";
import { cn } from "@/lib/utils";

export function SigilPlate({
  reduced,
  title,
  className,
}: {
  reduced: string;
  title?: string;
  className?: string;
}) {
  const plate = plateFor(reduced || title || "IAM");
  const rim = (reduced || "IAM").slice(0, 12);
  return (
    <div
      className={cn(
        "relative aspect-tarot overflow-hidden rounded-xl bg-void foil-frame",
        className,
      )}
    >
      <img
        src={plate}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <img
        src="/art/grimoire-wax.jpg"
        alt=""
        className="absolute -right-6 -bottom-8 size-36 rotate-12 object-cover opacity-50 mix-blend-screen sm:size-44"
      />
      <div className="absolute inset-0 bg-void/25" />
      <div className="pointer-events-none absolute inset-3 rounded-[1.1rem] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-gold)_55%,transparent)]" />
      <div className="pointer-events-none absolute inset-5 rounded-[0.9rem] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-magenta)_40%,transparent)]" />
      <Corner x="left-4" y="top-4" />
      <Corner x="right-4" y="top-4" flipX />
      <Corner x="left-4" y="bottom-16" flipY />
      <Corner x="right-4" y="bottom-16" flipX flipY />
      <p className="pointer-events-none absolute inset-x-6 top-5 text-center font-mono text-[0.6rem] tracking-[0.42em] text-gold/80">
        {rim.split("").join(" · ")}
      </p>
      <SigilMark
        key={reduced || "empty"}
        reduced={reduced}
        className="absolute inset-x-5 top-12 mix-blend-screen sm:inset-x-7 sm:top-14"
      />
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <p className="font-mono text-lg tracking-[0.32em] text-gold sm:text-xl">
          {reduced || "—"}
        </p>
        {title ? (
          <p className="mt-1 font-display text-sm tracking-[0.16em] text-ivory uppercase">
            {title}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Corner({
  x,
  y,
  flipX,
  flipY,
}: {
  x: string;
  y: string;
  flipX?: boolean;
  flipY?: boolean;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute size-7",
        x,
        y,
        flipX && "-scale-x-100",
        flipY && "-scale-y-100",
      )}
      aria-hidden
    >
      <span className="absolute top-0 left-0 h-px w-7 bg-gold" />
      <span className="absolute top-0 left-0 h-7 w-px bg-gold" />
      <span className="absolute top-1 left-1 h-px w-4 bg-magenta" />
      <span className="absolute top-1 left-1 h-4 w-px bg-magenta" />
    </span>
  );
}
