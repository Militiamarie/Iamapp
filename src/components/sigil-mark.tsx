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
          strokeWidth={s.gold ? 1.45 : 1.05}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={s.gold ? 0.96 : 0.78}
          pathLength={1}
          className="sigil-stroke"
          style={{ ["--delay" as string]: `${Math.min(i, 22) * 28}ms` }}
          filter={s.gold ? `url(#${uid}-glow)` : undefined}
        />
      ))}
      {(reduced || "IAM").split("").map((ch, i, arr) => {
        const a = (i / Math.max(arr.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const x = 100 + Math.cos(a) * 92;
        const y = 100 + Math.sin(a) * 92;
        return (
          <text
            key={`${ch}-${i}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--color-gold)"
            fontSize="7"
            fontFamily="IBM Plex Mono, ui-monospace, monospace"
            letterSpacing="0.12em"
            opacity="0.85"
          >
            {ch}
          </text>
        );
      })}
    </svg>
  );
}
