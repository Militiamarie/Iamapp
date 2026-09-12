import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { ScanBooth } from "@/components/scan-booth";
import { OnrampLink } from "@/components/onramp-link";
import { SendRail } from "@/components/send-rail";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { basescanAddress } from "@/lib/chain";
import { openSeaCreate } from "@/lib/onramp";
import {
  cashPayUrl,
  coinbaseSendUrl,
  hitAction,
  parseScan,
  RAIL_LABEL,
  type ScanHit,
} from "@/lib/rails";
import { useIam } from "@/lib/store";

export function ScanDock({
  compact = false,
  seed,
  fromLinkscan = false,
}: {
  compact?: boolean;
  seed?: string;
  fromLinkscan?: boolean;
}) {
  const collectScan = useIam((s) => s.collectScan);
  const wallet = useIam((s) => s.wallet);
  const ready = useIam((s) => s.ready);
  const [hit, setHit] = useState<ScanHit | null>(null);
  const [amount, setAmount] = useState("12");
  const seeded = useRef(false);
  const address = wallet.connected ? wallet.address : undefined;
  const payTo = hit?.address;

  function keep(next: ScanHit) {
    setHit(next);
    const row = collectScan(next);
    if (row) {
      toast(
        fromLinkscan
          ? `LinkScan · ${RAIL_LABEL[next.kind]}`
          : `Logged · ${RAIL_LABEL[next.kind]}`,
      );
    } else if (next.url) {
      toast(fromLinkscan ? "LinkScan sent a link" : "Unrecognized rail");
    }
  }

  useEffect(() => {
    if (!ready || seeded.current || !seed) return;
    seeded.current = true;
    keep(parseScan(seed));
  }, [ready, seed]);

  const payHref =
    hit?.kind === "cashapp" && hit.cashtag
      ? cashPayUrl(hit.cashtag, Math.max(1, Number(amount) || 0))
      : hit?.kind === "coinbase"
        ? hit.url
        : hit?.kind === "eth"
          ? coinbaseSendUrl(hit.address)
          : hit?.url;

  return (
    <div className={compact ? "flex flex-col gap-4" : "grid gap-6 lg:grid-cols-[1.2fr_18rem]"}>
      <ScanBooth onHit={keep} />
      <aside className="rounded-lg bg-obsidian p-4 foil-frame">
        <p className="text-xs uppercase tracking-[0.18em] text-ash">Hit</p>
        {hit ? (
          <>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-magenta">
              {fromLinkscan ? "LinkScan · " : ""}
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
                <Label htmlFor="dock-amt">Amount (USD)</Label>
                <Input
                  id="dock-amt"
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
            {hit.kind === "opensea" || hit.kind === "nft" ? (
              <Button asChild variant="outline" className="mt-2 w-full">
                <a href={openSeaCreate()} target="_blank" rel="noreferrer">
                  Mint on OpenSea
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            ) : null}
            {hit.kind === "eth" || hit.kind === "coinbase" ? (
              <>
                {payTo ? <SendRail key={payTo} to={payTo} compact /> : null}
                <OnrampLink
                  asset="ETH"
                  address={hit.address || address}
                  className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md px-3 text-xs uppercase tracking-[0.14em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent)]"
                >
                  Fund on Coinbase
                  <ExternalLink className="size-3.5" />
                </OnrampLink>
                {hit.address ? (
                  <Button asChild variant="outline" className="mt-2 w-full">
                    <a
                      href={basescanAddress(hit.address)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Basescan
                    </a>
                  </Button>
                ) : null}
              </>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm text-ash">
            Camera, paste, still, or LinkScan. Cash App, Coinbase, OpenSea,
            NFT markets, barcodes. Then pay, send on Base, or mint.
          </p>
        )}
      </aside>
    </div>
  );
}
