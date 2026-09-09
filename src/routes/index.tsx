import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CatalogCard } from "@/components/catalog-card";
import { HouseLinks } from "@/components/house-links";
import { Button } from "@/components/ui/button";
import { FEATURED_IDS, mergeCatalog } from "@/lib/catalog";
import { useIam } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Temple });

function Temple() {
  const minted = useIam((s) => s.minted);
  const catalog = mergeCatalog(minted);
  const featured = FEATURED_IDS.map((id) =>
    catalog.find((c) => c.id === id),
  ).filter(Boolean);

  return (
    <div className="pt-6 sm:pt-10">
      <section className="relative overflow-hidden rounded-xl foil-frame">
        <img
          src="/art/hero.jpg"
          alt="Gold-leaf temple nave with magenta drips"
          className="h-[min(72vh,640px)] w-full object-cover"
        />
        <div className="absolute inset-0 scrim-b" />
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-10">
          <p className="text-[0.65rem] uppercase tracking-[0.32em] text-gold">
            Melitiamarie · 818
          </p>
          <h1 className="mt-2 foil-text font-display text-6xl tracking-[0.22em] sm:text-8xl">
            I AM
          </h1>
          <p className="mt-3 max-w-md font-display text-lg tracking-wide text-ivory sm:text-xl">
            Playable 1/1s. Trade on OpenSea. Mint your own.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/altar">Open onchain</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/mint">Mint yours</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
          The tapes live here
        </p>
        <HouseLinks className="mt-3 flex flex-wrap gap-2" />
      </section>

      <div className="foil-rule my-10" />

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
              Featured drops
            </p>
            <h2 className="mt-1 text-2xl text-ivory uppercase">On the altar</h2>
          </div>
          <Link
            to="/market"
            className="hidden min-h-11 items-center text-xs uppercase tracking-[0.16em] text-gold sm:inline-flex"
          >
            Full catalog
            <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {featured.map((item) =>
            item ? <CatalogCard key={item.id} item={item} featured /> : null,
          )}
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HouseNote
          to="/altar"
          kicker="Onchain"
          title="Base"
          body="Connect Coinbase Wallet. Onramp ETH. Stamp a 1/1 on Base. Trade it on OpenSea."
        />
        <HouseNote
          to="/scan"
          kicker="Scan"
          title="Door"
          body="Camera on Cash App, Coinbase, OpenSea. Pay, trade, or mint on the live rail."
        />
        <HouseNote
          to="/mint"
          kicker="Studio"
          title="Make yours"
          body="Social house. Press your own playable 1/1 from a tape or YouTube."
        />
        <HouseNote
          to="/grimoire"
          kicker="Reducer"
          title="Grimoire"
          body="Write a vow. Vowels burn. The remaining letters lock into a plate."
        />
      </section>

      <section className="mt-10 overflow-hidden rounded-xl foil-frame">
        <div className="relative bg-obsidian px-5 py-8 sm:px-8">
          <p className="text-[0.65rem] uppercase tracking-[0.22em] text-gold">
            Carry the house
          </p>
          <h2 className="mt-2 text-2xl text-ivory uppercase sm:text-3xl">
            Install I AM
          </h2>
          <p className="mt-2 max-w-lg text-sm text-ash">
            Home Screen on iPhone. Launcher on Android. Same temple in the
            browser. Privacy, terms, and support ship with it.
          </p>
          <Button asChild className="mt-5">
            <Link to="/install">Get the app</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function HouseNote({
  to,
  kicker,
  title,
  body,
}: {
  to: "/house" | "/scan" | "/grimoire" | "/mint" | "/altar" | "/market" | "/install";
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <Link to={to} className="rounded-lg bg-obsidian p-4 foil-frame sm:p-5">
      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-magenta">
        {kicker}
      </p>
      <h3 className="mt-1 text-lg text-ivory uppercase">{title}</h3>
      <p className="mt-2 text-sm text-ash">{body}</p>
    </Link>
  );
}
