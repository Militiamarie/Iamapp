import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { OnrampLink } from "@/components/onramp-link";
import { Button } from "@/components/ui/button";
import { cdpStatus } from "@/lib/cdp-session";
import {
  coinbaseTrade,
  coinbaseWallet,
  openSeaCreate,
  openSeaStudio,
} from "@/lib/onramp";
import { cashPayUrl } from "@/lib/rails";
import { HOUSE } from "@/lib/site";
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
  const [cdpLive, setCdpLive] = useState(false);

  useEffect(() => {
    void cdpStatus()
      .then((s) => {
        if (s.ok) setCdpLive(true);
      })
      .catch(() => {
        setCdpLive(false);
      });
  }, []);

  const cards: {
    kicker: string;
    title: string;
    body: string;
    href?: string;
    asset?: "USDC" | "ETH";
  }[] = [
    {
      kicker: HOUSE.productions,
      title: "Onramp USDC",
      body: "Buy USDC on Base. Signed session under Melitia Marie Productions.",
      asset: "USDC",
    },
    {
      kicker: HOUSE.productions,
      title: "Onramp ETH",
      body: "Buy ether on Base. Gas to stamp a 1/1 and trade it.",
      asset: "ETH",
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
        {HOUSE.productions}
      </p>
      <h2 className="mt-1 text-lg text-ivory uppercase sm:text-xl">
        Coinbase Developer
      </h2>
      <p className="mt-1 max-w-xl text-sm text-ash">
        Onramp under Melitia Marie Productions on Coinbase. USDC and ETH land
        on Base. This house does not hold your keys.
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-magenta">
        {cdpLive ? "CDP session live" : "Coinbase rail"}
      </p>
      <div
        className={cn(
          "mt-4 grid gap-3",
          compact ? "sm:grid-cols-2" : "sm:grid-cols-2",
        )}
      >
        {cards.map((c) =>
          c.href ? (
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
          ) : (
            <OnrampLink
              key={c.title}
              asset={c.asset}
              amountUsd={amountUsd}
              address={address}
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
            </OnrampLink>
          ),
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={HOUSE.cdpPortal} target="_blank" rel="noreferrer">
            CDP Portal
            <ExternalLink className="size-3" />
          </a>
        </Button>
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