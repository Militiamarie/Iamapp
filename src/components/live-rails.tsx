import { ExternalLink, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { OnrampLink } from "@/components/onramp-link";
import { Button } from "@/components/ui/button";
import { openSeaCollection } from "@/lib/chain";
import {
  coinbaseTrade,
  coinbaseWallet,
  openSeaLogin,
  openSeaProfile,
  openSeaStudio,
  openSeaWallet,
} from "@/lib/onramp";
import { HOUSE } from "@/lib/site";
import { useOnchain } from "@/lib/onchain";

export function LiveRails() {
  const ready = useOnchain((s) => s.ready);
  const status = useOnchain((s) => s.status);
  const address = useOnchain((s) => s.address);
  const collection = useOnchain((s) => s.collection);
  const connectCoinbase = useOnchain((s) => s.connectCoinbase);
  const connecting = !ready || status === "connecting";
  const seaHref = address ? openSeaWallet(address) : openSeaProfile();

  async function onCoinbase() {
    const ok = await connectCoinbase();
    if (ok) toast("Coinbase Wallet live");
    else toast(useOnchain.getState().error || "Open Coinbase Wallet");
  }

  async function onOpenSea() {
    if (!address) {
      const ok = await connectCoinbase();
      const addr = useOnchain.getState().address;
      if (ok && addr) {
        window.open(openSeaWallet(addr), "_blank", "noopener,noreferrer");
        toast("OpenSea · wallet");
        return;
      }
      window.open(openSeaLogin(), "_blank", "noopener,noreferrer");
      toast("Connect on OpenSea");
      return;
    }
    window.open(openSeaWallet(address), "_blank", "noopener,noreferrer");
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      <article className="rounded-lg bg-obsidian p-4 foil-frame">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-magenta">
              {HOUSE.productions}
            </p>
            <h2 className="mt-1 text-lg text-ivory uppercase">Coinbase</h2>
          </div>
          <span className="rounded-full bg-gold/15 px-2 py-1 text-xs uppercase tracking-[0.14em] text-gold">
            Live
          </span>
        </div>
        <p className="mt-2 text-sm text-ash">
          Connect Coinbase Wallet. Buy USDC or ETH on Base. Trade the live
          book. This house never holds keys.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            type="button"
            disabled={connecting}
            onClick={() => void onCoinbase()}
          >
            {status === "connecting" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Wallet className="size-3.5" />
            )}
            {address ? "Coinbase connected" : "Connect Coinbase"}
          </Button>
          <OnrampLink
            asset="ETH"
            address={address}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md px-3 text-xs uppercase tracking-[0.14em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent)]"
          >
            Onramp ETH
            <ExternalLink className="size-3.5" />
          </OnrampLink>
          <Button asChild variant="outline">
            <a href={coinbaseTrade("ETH-USD")} target="_blank" rel="noreferrer">
              Trade on Coinbase
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button asChild variant="ghost">
            <a href={coinbaseWallet()} target="_blank" rel="noreferrer">
              Coinbase Wallet
            </a>
          </Button>
        </div>
      </article>

      <article className="rounded-lg bg-obsidian p-4 foil-frame">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-magenta">
              {HOUSE.handle}
            </p>
            <h2 className="mt-1 text-lg text-ivory uppercase">OpenSea</h2>
          </div>
          <span className="rounded-full bg-gold/15 px-2 py-1 text-xs uppercase tracking-[0.14em] text-gold">
            Live
          </span>
        </div>
        <p className="mt-2 text-sm text-ash">
          Connect the same wallet on OpenSea. Trade the house 1/1s. Studio
          presses a listing on Base.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            type="button"
            disabled={connecting}
            onClick={() => void onOpenSea()}
          >
            {status === "connecting" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Wallet className="size-3.5" />
            )}
            Connect OpenSea
          </Button>
          <Button asChild variant="outline">
            <a href={seaHref} target="_blank" rel="noreferrer">
              {address ? "OpenSea wallet" : "House on OpenSea"}
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={openSeaStudio()} target="_blank" rel="noreferrer">
              OpenSea Studio
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          {collection ? (
            <Button asChild variant="ghost">
              <a
                href={openSeaCollection(collection)}
                target="_blank"
                rel="noreferrer"
              >
                Collection
              </a>
            </Button>
          ) : null}
        </div>
      </article>
    </section>
  );
}
