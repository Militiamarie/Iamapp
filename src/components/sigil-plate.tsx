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
      <div className="absolute inset-0 bg-void/20" />
      <SigilMark
        key={reduced || "empty"}
        reduced={reduced}
        className="absolute inset-x-6 top-10 mix-blend-screen sm:inset-x-8 sm:top-12"
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
