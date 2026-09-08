import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pause, Play, Share2 } from "lucide-react";
import { toast } from "sonner";
import { CatalogCard } from "@/components/catalog-card";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { Button } from "@/components/ui/button";
import { isPlayable, mergeCatalog } from "@/lib/catalog";
import { formatUsdc } from "@/lib/format";
import {
  nftMeta,
  openSeaFindUrl,
  openSeaListUrl,
  shareDrop,
} from "@/lib/nft";
import { asPlaySource, usePlayer } from "@/lib/player";
import { useIam } from "@/lib/store";

export const Route = createFileRoute("/drop/$itemId")({ component: Drop });

function Drop() {
  const { itemId } = Route.useParams();
  const minted = useIam((s) => s.minted);
  const owned = useIam((s) => s.isOwned(itemId));
  const buyItem = useIam((s) => s.buyItem);
  const catalog = useMemo(() => mergeCatalog(minted), [minted]);
  const item = catalog.find((c) => c.id === itemId);
  const play = usePlayer((s) => s.play);
  const toggle = usePlayer((s) => s.toggle);
  const current = usePlayer((s) => s.current);
  const playing = usePlayer((s) => s.playing);
  const [open, setOpen] = useState(false);

  if (!item) {
    return (
      <div className="pt-10">
        <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
          Drop
        </p>
        <h1 className="mt-1 text-3xl text-ivory uppercase">Sealed</h1>
        <p className="mt-2 text-sm text-ash">That 1/1 is not on this altar.</p>
        <Button asChild className="mt-6">
          <Link to="/market">Enter the market</Link>
        </Button>
      </div>
    );
  }

  const meta = nftMeta(item);
  const live = current?.id === item.id && playing;
  const more = catalog.filter((c) => c.id !== item.id && c.kind === item.kind).slice(0, 4);

  return (
    <div className="pt-6 sm:pt-10">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
        Collector 1/1
      </p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="overflow-hidden rounded-xl foil-frame">
          <img src={item.image} alt="" className="aspect-tarot w-full object-cover" />
        </div>
        <div>
          <h1 className="text-3xl text-ivory uppercase sm:text-5xl">{item.title}</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-gold">
            {item.creator} · I AM collection · {meta.chain} #{meta.tokenId}
          </p>
          <p className="mt-4 max-w-lg text-sm text-ash">{item.blurb}</p>
          <dl className="mt-6 grid max-w-md grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-obsidian p-3 foil-frame">
              <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-ash">
                Price
              </dt>
              <dd className="mt-1 text-gold">{formatUsdc(item.priceUsdc)}</dd>
            </div>
            <div className="rounded-md bg-obsidian p-3 foil-frame">
              <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-ash">
                Standard
              </dt>
              <dd className="mt-1 text-ivory">{meta.standard} · ed. {item.edition}</dd>
            </div>
            <div className="col-span-2 rounded-md bg-obsidian p-3 foil-frame">
              <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-ash">
                Royalty
              </dt>
              <dd className="mt-1 text-ivory">{meta.royalty}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            {isPlayable(item) ? (
              <Button
                onClick={() => {
                  if (current?.id === item.id) toggle();
                  else play(asPlaySource(item), catalog.filter(isPlayable).map(asPlaySource));
                }}
              >
                {live ? <Pause className="size-4" /> : <Play className="size-4" />}
                {live ? "Pause" : "Play tape"}
              </Button>
            ) : null}
            {owned ? (
              <Button variant="outline" disabled>
                In your vault
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setOpen(true)}>
                Collect
              </Button>
            )}
            <Button asChild variant="outline">
              <a href={openSeaListUrl()} target="_blank" rel="noreferrer">
                List on OpenSea
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={openSeaFindUrl(item.title, item.creator)}
                target="_blank"
                rel="noreferrer"
              >
                Find on OpenSea
              </a>
            </Button>
            <Button
              variant="ghost"
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
      </div>
      {more.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-lg text-ivory uppercase">More of the house</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {more.map((row) => (
              <CatalogCard key={row.id} item={row} />
            ))}
          </div>
        </section>
      ) : null}
      <CheckoutDialog
        open={open}
        onOpenChange={setOpen}
        title={item.title}
        blurb={`1/1 · #${meta.tokenId}`}
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
    </div>
  );
}
