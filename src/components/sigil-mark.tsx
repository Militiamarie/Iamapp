import { useId } from "react";
import { buildSigil } from "@/lib/sigil";
import { cn } from "@/lib/utils";

export function SigilMark({
  reduced,
  className,
  filled = false,
}: {
  reduced: string;
  className?: string;
  filled?: boolean;
}) {
  const strokes = buildSigil(reduced || "IAM");
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("text-gold", className)}
      aria-hidden="true"
    >
      <defs>
        <filter
          id={`${uid}-glow`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {filled ? (
        <rect width="200" height="200" fill="var(--color-void)" />
      ) : null}
      {strokes.map((s, i) => (
        <path
          key={i}
          d={s.d}
          fill="none"
          stroke={s.gold ? "var(--color-gold)" : "var(--color-magenta)"}
          strokeWidth={s.gold ? 1.6 : 1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={s.gold ? 0.95 : 0.82}
          pathLength={1}
          className="sigil-stroke"
          style={{ ["--delay" as string]: `${Math.min(i, 14) * 45}ms` }}
          filter={s.gold ? `url(#${uid}-glow)` : undefined}
        />
      ))}
    </svg>
  );
}
