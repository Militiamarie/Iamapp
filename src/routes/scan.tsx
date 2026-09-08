import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { RailQr } from "@/components/rail-qr";
import { ScanBooth } from "@/components/scan-booth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  cashPayUrl,
  coinbaseSendUrl,
  hitAction,
  houseRails,
  RAIL_LABEL,
  type ScanHit,
} from "@/lib/rails";
import { useIam } from "@/lib/store";

export const Route = createFileRoute("/scan")({ component: Scan });

function Scan() {
  const collectScan = useIam((s) => s.collectScan);
  const collects = useIam((s) => s.collects);
  const profile = useIam((s) => s.profile);
  const [hit, setHit] = useState<ScanHit | null>(null);
  const [amount, setAmount] = useState("12");
  const mine = houseRails(profile);

  function keep(next: ScanHit) {
    setHit(next);
    const row = collectScan(next);
    if (row) toast(`Logged · ${RAIL_LABEL[next.kind]}`);
  }

  const payHref =
    hit?.kind === "cashapp" && hit.cashtag
      ? cashPayUrl(hit.cashtag, Math.max(1, Number(amount) || 0))
      : hit?.kind === "coinbase"
        ? hit.url
        : hit?.kind === "eth"
          ? coinbaseSendUrl(hit.address)
          : hit?.url;

  return (
    <div className="pt-6 sm:pt-10">
      <p className="text-xs uppercase tracking-[0.22em] text-magenta">Door</p>
      <h1 className="mt-1 text-3xl text-ivory uppercase sm:text-4xl">Scan</h1>
      <p className="mt-2 max-w-xl text-sm text-ash">
        Camera on a Cash App cashtag, Coinbase wallet, OpenSea listing, or ETH
        address. Opens the real rail. Receipt stays in Collect.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_20rem]">
        <ScanBooth onHit={keep} />

        <aside className="rounded-lg bg-obsidian p-4 foil-frame">
          <p className="text-xs uppercase tracking-[0.18em] text-ash">Hit</p>
          {hit ? (
            <>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-magenta">
                {RAIL_LABEL[hit.kind]}
              </p>
              <h2 className="mt-1 font-display text-xl tracking-[0.12em] text-ivory uppercase">
                {hit.title}
              </h2>
              <p className="mt-2 break-all font-mono text-xs text-ash">
                {hit.display}
              </p>
              {hit.kind === "cashapp" ? (
                <div className="mt-4">
                  <Label htmlFor="pay-amt">Amount (USD)</Label>
                  <Input
                    id="pay-amt"
                    type="number"
                    min={1}
                    step={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              ) : null}
              {payHref ? (
                <Button asChild className="mt-4 w-full">
                  <a href={payHref} target="_blank" rel="noreferrer">
                    {hitAction(hit)}
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              ) : null}
              {hit.kind === "eth" && hit.address ? (
                <Button asChild variant="outline" className="mt-2 w-full">
                  <a
                    href={`https://etherscan.io/address/${hit.address}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on Etherscan
                  </a>
                </Button>
              ) : null}
            </>
          ) : (
            <p className="mt-3 text-sm text-ash">
              No hit yet. Scan or paste. House Cash App:{" "}
              {profile.links.cashapp || "set it in Edit house"}.
            </p>
          )}
        </aside>
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
