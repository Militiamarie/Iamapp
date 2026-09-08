import { ExternalLink } from "lucide-react";
import { Ago } from "@/components/ago";
import { RAIL_LABEL } from "@/lib/rails";
import type { ChainCollect } from "@/lib/types";

export function CollectCard({
  collect,
  kicker,
}: {
  collect: ChainCollect;
  kicker?: string;
}) {
  return (
    <article className="rounded-lg bg-obsidian p-4 foil-frame">
      <p className="text-xs uppercase tracking-[0.16em] text-magenta">
        {kicker ?? RAIL_LABEL[collect.kind]}
      </p>
      <h2 className="mt-1 font-display text-lg tracking-[0.12em] text-ivory uppercase">
        {collect.title}
      </h2>
      <p className="mt-1 font-mono text-xs text-ash">{collect.display}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-ash">
        <Ago at={collect.at} />
      </p>
      <a
        href={collect.url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex min-h-11 items-center gap-1 text-xs uppercase tracking-[0.14em] text-gold"
      >
        Trade on {RAIL_LABEL[collect.kind]}
        <ExternalLink className="size-3" />
      </a>
    </article>
  );
}
