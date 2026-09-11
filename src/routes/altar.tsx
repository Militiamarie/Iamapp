import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Stamp } from "lucide-react";
import { CollectCard } from "@/components/collect-card";
import { HouseLinks } from "@/components/house-links";
import { LiveRails } from "@/components/live-rails";
import { OnchainVault } from "@/components/onchain-vault";
import { OnrampPanel } from "@/components/onramp-panel";
import { RailQr } from "@/components/rail-qr";
import { ScanDock } from "@/components/scan-dock";
import { Button } from "@/components/ui/button";
import { openSeaCreate, openSeaHome } from "@/lib/onramp";
import { houseRails, openSeaUrl } from "@/lib/rails";
import { useIam } from "@/lib/store";

export const Route = createFileRoute("/altar")({ component: Altar });

export function Altar() {
  const profile = useIam((s) => s.profile);
  const collects = useIam((s) => s.collects);
  const minted = useIam((s) => s.minted);
  const rails = houseRails(profile);
  const os = profile.links.opensea.trim();
  const openSeaProfile = os ? openSeaUrl(os) : openSeaHome();
  const onBase = minted.filter((m) => m.onchain).length;

  return (
    <div className="pt-6 sm:pt-10">
      <p className="text-xs uppercase tracking-[0.22em] text-magenta">
        Melitia Marie Productions
      </p>
      <h1 className="mt-1 text-3xl text-ivory uppercase sm:text-4xl">
        Productions
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ash">
        Coinbase is live on the web under Melitia Marie Productions. Connect
        Wallet. Send ETH or USDC. Hit the Vibenet pool. Stamp a 1/1 on Base.
        Scanner at the door.
      </p>

      <div className="mt-8">
        <LiveRails />
      </div>

      <div className="mt-8">
        <OnchainVault />
      </div>

      <section className="mt-10">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Door</p>
        <h2 className="mt-1 text-lg text-ivory uppercase sm:text-xl">Scanner</h2>
        <p className="mt-1 max-w-xl text-sm text-ash">
          Camera on a Cash App cashtag, Coinbase wallet, OpenSea listing, or
          ETH address. Send on Base from the hit, or open the live rail.
        </p>
        <div className="mt-5">
          <ScanDock />
        </div>
      </section>

      <div className="mt-10">
        <OnrampPanel />
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg text-ivory uppercase">OpenSea</h2>
            <p className="mt-1 max-w-xl text-sm text-ash">
              House profile is live. Trade a Base 1/1, or mint through OpenSea
              Studio.
            </p>
          </div>
          <span className="rounded-full bg-gold/15 px-2 py-1 text-xs uppercase tracking-[0.14em] text-gold">
            Live
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <a href={openSeaCreate()} target="_blank" rel="noreferrer">
              OpenSea Studio
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={openSeaProfile} target="_blank" rel="noreferrer">
              OpenSea profile
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/mint">
              <Stamp className="size-3.5" />
              Studio
            </Link>
          </Button>
        </div>
        {onBase > 0 ? (
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-gold">
            {onBase} live on Base
          </p>
        ) : minted.length > 0 ? (
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-gold">
            {minted.length} house 1/1 waiting to stamp on Base
          </p>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="text-lg text-ivory uppercase">Tapes live here</h2>
        <p className="mt-1 max-w-xl text-sm text-ash">
          Instagram, YouTube, BandLab, Rapchat, Rap Fame — every page that holds
          the music.
        </p>
        <HouseLinks className="mt-4 flex flex-wrap gap-2" />
      </section>

      {rails.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg text-ivory uppercase">House rails</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {rails.map((r) => (
              <RailQr key={r.label} rail={r} />
            ))}
          </div>
        </section>
      ) : null}

      {collects.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg text-ivory uppercase">Collect</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {collects.slice(0, 6).map((c) => (
              <li key={c.id}>
                <CollectCard collect={c} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
