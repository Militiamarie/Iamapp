import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  coinbaseOnramp,
  coinbaseTrade,
  coinbaseWallet,
  openSeaCreate,
  openSeaStudio,
} from "@/lib/onramp";
import { cashPayUrl } from "@/lib/rails";
import { useOnchain } from "@/lib/onchain";
import { useIam } from "@/lib/store";
import { cn } from "@/lib/utils";

export function OnrampPanel({
  amountUsd,
  compact = false,
}: {
  amountUsd?: number;
  compact?: boolean;
}) {
  const address = useOnchain((s) => s.address);
  const profile = useIam((s) => s.profile);
  const cash = profile.links.cashapp.trim();

  const cards: {
    kicker: string;
    title: string;
    body: string;
    href: string;
  }[] = [
    {
      kicker: "Coinbase",
      title: "Onramp USDC",
      body: "Buy USDC on Base. The rail OpenSea and the house settle on.",
      href: coinbaseOnramp({ asset: "USDC", amountUsd, address }),
    },
    {
      kicker: "Coinbase",
      title: "Onramp ETH",
      body: "Buy ether on Base. Gas to stamp a 1/1 and trade it.",
      href: coinbaseOnramp({ asset: "ETH", amountUsd, address }),
    },
    {
      kicker: "Coinbase",
      title: "Trade",
      body: "Advanced Trade · ETH-USD. Live book on Coinbase.",
      href: coinbaseTrade("ETH-USD"),
    },
    {
      kicker: "OpenSea",
      title: "Mint on-chain",
      body: "Press a 1/1 on Ethereum or Base. List it from Studio.",
      href: openSeaCreate(),
    },
  ];

  return (
    <section>
      <p className="text-xs uppercase tracking-[0.18em] text-gold">
        Coinbase Onramp
      </p>
      <h2 className="mt-1 text-lg text-ivory uppercase sm:text-xl">
        Onramp
      </h2>
      <p className="mt-1 max-w-xl text-sm text-ash">
        Buy USDC or ETH on Coinbase, land it on Base, stamp on-chain, trade on
        OpenSea. This house does not hold your keys.
      </p>
      <div
        className={cn(
          "mt-4 grid gap-3",
          compact ? "sm:grid-cols-2" : "sm:grid-cols-2",
        )}
      >
        {cards.map((c) => (
          <a
            key={c.title}
            href={c.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-obsidian p-4 foil-frame"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-magenta">
              {c.kicker}
            </p>
            <h3 className="mt-1 flex items-center gap-2 font-display text-lg tracking-[0.12em] text-ivory uppercase">
              {c.title}
              <ExternalLink className="size-3.5 text-gold" />
            </h3>
            <p className="mt-2 text-sm text-ash">{c.body}</p>
          </a>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={coinbaseWallet()} target="_blank" rel="noreferrer">
            Coinbase Wallet
            <ExternalLink className="size-3" />
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={openSeaStudio()} target="_blank" rel="noreferrer">
            OpenSea Studio
            <ExternalLink className="size-3" />
          </a>
        </Button>
        {cash ? (
          <Button asChild variant="outline" size="sm">
            <a
              href={cashPayUrl(cash.replace(/^\$/, ""), amountUsd)}
              target="_blank"
              rel="noreferrer"
            >
              Cash App
              <ExternalLink className="size-3" />
            </a>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
