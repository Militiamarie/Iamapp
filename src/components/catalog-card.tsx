import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Pause, Play, Share2 } from "lucide-react";
import { toast } from "sonner";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { SigilMark } from "@/components/sigil-mark";
import { Button } from "@/components/ui/button";
import { isPlayable, mergeCatalog } from "@/lib/catalog";
import { formatUsdc, kindLabel } from "@/lib/format";
import {
  nftMeta,
  openSeaFindUrl,
  openSeaListUrl,
  shareDrop,
} from "@/lib/nft";
import { asPlaySource, usePlayer } from "@/lib/player";
import { useIam } from "@/lib/store";
import type { CatalogItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CatalogCard({
  item,
  featured = false,
}: {
  item: CatalogItem;
  featured?: boolean;
}) {
  const owned = useIam((s) => s.isOwned(item.id));
  const buyItem = useIam((s) => s.buyItem);
  const minted = useIam((s) => s.minted);
  const [open, setOpen] = useState(false);
  const current = usePlayer((s) => s.current);
  const playing = usePlayer((s) => s.playing);
  const play = usePlayer((s) => s.play);
  const toggle = usePlayer((s) => s.toggle);
  const active = current?.id === item.id;
  const live = active && playing;
  const canPlay = isPlayable(item);
  const meta = nftMeta(item);

  function onPlay() {
    if (active) {
      toggle();
      return;
    }
    const queue = mergeCatalog(minted).filter(isPlayable).map(asPlaySource);
    play(asPlaySource(item), queue);
  }

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg bg-obsidian foil-frame",
        featured && "sm:col-span-1",
      )}
    >
      <div className="relative aspect-tarot overflow-hidden bg-void">
        <img
          src={item.image}
          alt=""
          className="size-full object-cover transition-transform duration-(--motion-slow) ease-(--ease-out) group-hover:scale-[1.03]"
        />
        {item.kind === "sigil" && item.reduced ? (
          <SigilMark
            reduced={item.reduced}
            className="pointer-events-none absolute inset-x-6 top-8 mix-blend-screen sm:inset-x-8 sm:top-10"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 scrim-b" />
        <span className="absolute top-3 left-3 rounded-sm bg-void/70 px-2 py-1 font-sans text-[0.65rem] uppercase tracking-[0.18em] text-gold">
          {kindLabel(item.kind)} · 1/1
        </span>
        {item.kind === "quote" && item.quote ? (
          <p className="pointer-events-none absolute inset-x-4 bottom-4 font-display text-lg leading-snug tracking-wide text-ivory">
            {item.quote}
          </p>
        ) : null}
        {item.kind === "sigil" && item.reduced ? (
          <p className="pointer-events-none absolute inset-x-3 bottom-4 text-center font-mono text-sm tracking-[0.28em] text-gold">
            {item.reduced}
          </p>
        ) : null}
        {canPlay ? (
          <button
            type="button"
            onClick={onPlay}
            aria-label={live ? `Pause ${item.title}` : `Play ${item.title}`}
            className="absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gold text-void shadow-[0_12px_32px_-8px_rgb(0_0_0_/_0.7)] transition-transform duration-(--motion-quick) hover:scale-105"
          >
            {live ? (
              <Pause className="size-5" />
            ) : (
              <Play className="size-5 translate-x-px" />
            )}
          </button>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <div>
          <h3 className="font-display text-base tracking-[0.12em] text-ivory uppercase">
            {item.title}
          </h3>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gold-dim">
            {item.creator} · #{meta.tokenId} · {meta.chain}
          </p>
        </div>
        <p className="line-clamp-3 flex-1 text-sm text-ash">{item.blurb}</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm tabular-nums text-gold">
            {formatUsdc(item.priceUsdc)}
          </p>
          {owned ? (
            <span className="inline-flex min-h-11 items-center gap-1.5 px-2 text-xs uppercase tracking-[0.14em] text-gold">
              <Check className="size-3.5" />
              In vault
            </span>
          ) : (
            <Button size="sm" onClick={() => setOpen(true)}>
              Collect
            </Button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link to="/drop/$itemId" params={{ itemId: item.id }}>
              Drop
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={openSeaFindUrl(item.title, item.creator)} target="_blank" rel="noreferrer">
              Trade
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const result = await shareDrop(item);
              if (result === "copied") toast("Drop link copied");
            }}
          >
            <Share2 className="size-3.5" />
            Share
          </Button>
        </div>
      </div>
      <CheckoutDialog
        open={open}
        onOpenChange={setOpen}
        title={item.title}
        blurb={`1/1 · #${meta.tokenId} · ${meta.chain}`}
        priceUsdc={item.priceUsdc}
        confirmLabel="Collect 1/1"
        onConfirm={(rail) => {
          const ok = buyItem(item.id, rail);
          if (ok) {
            toast(`Collected · ${item.title}`, {
              action: {
                label: "OpenSea",
                onClick: () => {
                  window.open(openSeaListUrl(), "_blank", "noopener,noreferrer");
                },
              },
            });
          }
          return ok;
        }}
      />
    </article>
  );
}
