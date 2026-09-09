import { createFileRoute, Link } from "@tanstack/react-router";
import { OnrampPanel } from "@/components/onramp-panel";
import { RailQr } from "@/components/rail-qr";
import { ScanDock } from "@/components/scan-dock";
import { Button } from "@/components/ui/button";
import { houseRails, RAIL_LABEL } from "@/lib/rails";
import { useIam } from "@/lib/store";

export const Route = createFileRoute("/scan")({ component: Scan });

function Scan() {
  const collects = useIam((s) => s.collects);
  const profile = useIam((s) => s.profile);
  const mine = houseRails(profile);

  return (
    <div className="pt-6 sm:pt-10">
      <p className="text-xs uppercase tracking-[0.22em] text-magenta">Door</p>
      <h1 className="mt-1 text-3xl text-ivory uppercase sm:text-4xl">Scan</h1>
      <p className="mt-2 max-w-xl text-sm text-ash">
        Camera on a Cash App cashtag, Coinbase wallet, OpenSea listing, or ETH
        address. Coinbase Onramp sits under the booth for buy, trade, and
        on-chain mint.
      </p>

      <div className="mt-8">
        <ScanDock />
      </div>

      <div className="mt-12">
        <OnrampPanel />
      </div>

      <section className="mt-12">
        <p className="text-xs uppercase tracking-[0.18em] text-ash">Your rails</p>
        <h2 className="mt-1 text-2xl text-ivory uppercase">Scan me</h2>
        <p className="mt-2 max-w-xl text-sm text-ash">
          Hold these up. Cash App, Coinbase, and OpenSea read the code in the
          room.
        </p>
        {mine.length === 0 ? (
          <div className="mt-4">
            <p className="text-sm text-ash">
              Add a cashtag, Coinbase, or OpenSea under Edit house.
            </p>
            <Button asChild className="mt-4">
              <Link to="/house">Open the house</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {mine.map((r) => (
              <RailQr key={r.label} rail={r} />
            ))}
          </div>
        )}
      </section>

      {collects.length ? (
        <section className="mt-12">
          <p className="text-xs uppercase tracking-[0.18em] text-ash">Receipts</p>
          <h2 className="mt-1 text-2xl text-ivory uppercase">From the chain</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {collects.slice(0, 8).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-md bg-obsidian px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ivory">{c.title}</p>
                  <p className="truncate font-mono text-xs text-ash">
                    {RAIL_LABEL[c.kind]} · {c.display}
                  </p>
                </div>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs uppercase tracking-[0.14em] text-gold"
                >
                  Open
                </a>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/house">See them on Collect</Link>
          </Button>
        </section>
      ) : null}
    </div>
  );
}
