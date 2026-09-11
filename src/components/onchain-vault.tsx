import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SendRail } from "@/components/send-rail";
import { VibenetPool } from "@/components/vibenet-pool";
import {
  BASE_ID,
  VIBENET_ID,
  basescanTx,
  chainLabel,
  coinbaseDappUrl,
  openSeaCollection,
  openSeaItem,
} from "@/lib/chain";
import { formatEth, formatUsdc, shortAddr } from "@/lib/format";
import { coinbaseWallet } from "@/lib/onramp";
import { openHouseOnramp } from "@/lib/cdp-session";
import { HOUSE } from "@/lib/site";
import { seaUrl, useOnchain } from "@/lib/onchain";
import { useIam } from "@/lib/store";
import { cn } from "@/lib/utils";

export function OnchainVault() {
  const ready = useOnchain((s) => s.ready);
  const status = useOnchain((s) => s.status);
  const address = useOnchain((s) => s.address);
  const chainId = useOnchain((s) => s.chainId);
  const eth = useOnchain((s) => s.eth);
  const usdc = useOnchain((s) => s.usdc);
  const collection = useOnchain((s) => s.collection);
  const mints = useOnchain((s) => s.mints);
  const sends = useOnchain((s) => s.sends);
  const error = useOnchain((s) => s.error);
  const walletName = useOnchain((s) => s.walletName);
  const connect = useOnchain((s) => s.connect);
  const disconnect = useOnchain((s) => s.disconnect);
  const refresh = useOnchain((s) => s.refresh);
  const mintTape = useOnchain((s) => s.mintTape);
  const switchBase = useOnchain((s) => s.switchBase);
  const bindAddress = useIam((s) => s.bindAddress);
  const houseConnect = useIam((s) => s.connect);
  const stampOnchain = useIam((s) => s.stampOnchain);
  const minted = useIam((s) => s.minted);
  const [busy, setBusy] = useState<string | null>(null);
  const [dapp, setDapp] = useState("https://go.cb-w.com/dapp");
  const onVibenet = chainId === VIBENET_ID;
  const onBase = chainId === BASE_ID || !chainId;

  useEffect(() => {
    setDapp(coinbaseDappUrl());
  }, []);

  const waiting = minted.filter(
    (m) => !m.onchain && !mints.some((n) => n.itemId === m.id),
  );

  async function onConnect() {
    const ok = await connect();
    const addr = useOnchain.getState().address;
    if (ok && addr) {
      bindAddress(addr);
      toast("Onchain · Base");
    } else if (!ok) {
      toast(useOnchain.getState().error || "No wallet in this window");
    }
  }

  async function stamp(item: (typeof minted)[number]) {
    setBusy(item.id);
    const row = await mintTape({
      title: item.title,
      blurb: item.blurb,
      image: item.image,
      kind: item.kind,
      creator: item.creator,
      youtubeId: item.youtubeId,
      itemId: item.id,
    });
    setBusy(null);
    if (!row) {
      toast(useOnchain.getState().error || "Mint failed");
      return;
    }
    stampOnchain(item.id, {
      chain: "base",
      contract: row.contract,
      tokenId: row.tokenId,
      tx: row.tx,
    });
    toast(`On Base · #${row.tokenId}`);
  }

  return (
    <section className="rounded-lg bg-obsidian p-4 foil-frame sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold">
            {HOUSE.productions}
          </p>
          <h2 className="mt-1 text-lg text-ivory uppercase">Onchain</h2>
        </div>
        {address ? (
          <span className="rounded-full bg-gold/15 px-2 py-1 text-xs uppercase tracking-[0.14em] text-gold">
            {onVibenet ? "Pool live" : "Wallet live"}
          </span>
        ) : (
          <span className="rounded-full bg-gold/15 px-2 py-1 text-xs uppercase tracking-[0.14em] text-gold">
            Web live
          </span>
        )}
      </div>
      <p className="mt-2 max-w-xl text-sm text-ash">
        Coinbase is live on the web under Melitia Marie Productions. Send ETH or
        USDC. Connect the Vibenet pool. Stamp a 1/1 on Base. This house never
        holds your keys.
      </p>

      {address ? (
        <>
          <p className="mt-4 font-mono text-xs text-ash">
            {walletName ? `${walletName} · ` : ""}
            {shortAddr(address)}
            {chainId ? ` · ${chainLabel(chainId)}` : ""}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-sm bg-void px-3 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-ash">
                USDC
              </p>
              <p className="font-sans text-lg tabular-nums text-ivory">
                {formatUsdc(usdc)}
              </p>
            </div>
            <div className="rounded-sm bg-void px-3 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-ash">ETH</p>
              <p className="font-sans text-lg tabular-nums text-ivory">
                {formatEth(eth)}
              </p>
            </div>
          </div>
          {collection ? (
            <a
              href={openSeaCollection(collection)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-gold"
            >
              Collection {shortAddr(collection)}
              <ExternalLink className="size-3" />
            </a>
          ) : (
            <p className="mt-3 text-xs text-ash">
              First stamp deploys your I AM collection on Base. Then each tape
              is a token.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
            >
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                void openHouseOnramp({
                  asset: "ETH",
                  address,
                })
              }
            >
              Onramp ETH
              <ExternalLink className="size-3" />
            </Button>
            {onVibenet ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void switchBase()}
              >
                Back to Base
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => disconnect()}
            >
              Disconnect
            </Button>
          </div>
          <SendRail />
          <VibenetPool />
        </>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            disabled={!ready || status === "connecting"}
            onClick={() => void onConnect()}
          >
            {status === "connecting" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <WalletIcon className="size-3.5" />
            )}
            Connect onchain
          </Button>
          <Button asChild variant="outline">
            <a href={dapp} target="_blank" rel="noreferrer">
              Open in Coinbase Wallet
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={coinbaseWallet()} target="_blank" rel="noreferrer">
              Get Coinbase Wallet
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              houseConnect();
              toast("House demo vault. Onchain is Base.");
            }}
          >
            House demo
          </Button>
        </div>
      )}

      {!address ? <VibenetPool /> : null}

      {error && status === "error" ? (
        <p className="mt-3 text-sm text-magenta">{error}</p>
      ) : error && address ? (
        <p className="mt-3 text-sm text-magenta">{error}</p>
      ) : null}

      {waiting.length > 0 && address ? (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">
            Ready to stamp
          </p>
          {!onBase ? (
            <p className="mt-1 text-xs text-ash">
              Stamp switches you back to Base. Vibenet is the test pool only.
            </p>
          ) : null}
          <ul className="mt-2 flex flex-col gap-2">
            {waiting.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md bg-void px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ivory">{item.title}</p>
                  <p className="truncate text-xs uppercase tracking-[0.14em] text-ash">
                    {item.kind} · house 1/1
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy === item.id}
                  onClick={() => void stamp(item)}
                >
                  {busy === item.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : null}
                  Stamp on Base
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {sends.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">
            Sent on Base
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {sends.slice(0, 6).map((row) => (
              <li
                key={row.tx}
                className="flex items-center justify-between gap-3 rounded-md bg-void px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ivory">
                    {row.amount} {row.asset}
                  </p>
                  <p className="truncate font-mono text-xs text-ash">
                    To {shortAddr(row.to)}
                  </p>
                </div>
                <a
                  href={basescanTx(row.tx)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center text-xs uppercase tracking-[0.14em] text-gold"
                >
                  Tx
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {mints.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">
            On Base
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {mints.map((row) => (
              <li
                key={row.tx}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md bg-void px-3 py-2",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ivory">{row.title}</p>
                  <p className="truncate font-mono text-xs text-ash">
                    #{row.tokenId} · {shortAddr(row.contract)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={seaUrl(row)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center text-xs uppercase tracking-[0.14em] text-gold"
                  >
                    OpenSea
                  </a>
                  <a
                    href={basescanTx(row.tx)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center text-xs uppercase tracking-[0.14em] text-gold"
                  >
                    Tx
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function OnchainBadge({
  contract,
  tokenId,
}: {
  contract: string;
  tokenId: string;
}) {
  return (
    <a
      href={openSeaItem(contract, tokenId)}
      target="_blank"
      rel="noreferrer"
      className="absolute top-3 right-3 rounded-sm bg-gold px-2 py-1 font-sans text-[0.65rem] uppercase tracking-[0.18em] text-void"
    >
      Base #{tokenId}
    </a>
  );
}

export { basescanToken } from "@/lib/chain";
