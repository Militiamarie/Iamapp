import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { qrDataUrl } from "@/lib/qr";
import type { HouseRail } from "@/lib/rails";

export function RailQr({ rail }: { rail: HouseRail }) {
  const src = useMemo(() => qrDataUrl(rail.qrValue), [rail.qrValue]);
  return (
    <figure className="rounded-lg bg-obsidian p-4 foil-frame">
      <img
        src={src}
        alt={`${rail.label} QR`}
        className="mx-auto w-full max-w-48 rounded-sm bg-void"
      />
      <figcaption className="mt-3 text-center">
        <p className="text-xs uppercase tracking-[0.16em] text-gold">{rail.label}</p>
        <p className="mt-1 break-all font-mono text-xs text-ash">{rail.display}</p>
        <a
          href={rail.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-11 items-center justify-center gap-1.5 text-xs uppercase tracking-[0.14em] text-gold"
        >
          Open {rail.label}
          <ExternalLink className="size-3" />
        </a>
      </figcaption>
    </figure>
  );
}
