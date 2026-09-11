import { useEffect, useState } from "react";
import { Droplets, ExternalLink, Loader2, Waves } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  VIBENET_FAUCET,
  VIBENET_HUB,
  VIBENET_ID,
  VIBENET_NFV,
  VIBENET_USDV,
  chainLabel,
  vibenetHealth,
  vibenetToken,
  vibenetTx,
} from "@/lib/chain";
import { formatEth, shortAddr } from "@/lib/format";
import { useOnchain } from "@/lib/onchain";

export function VibenetPool() {
  const ready = useOnchain((s) => s.ready);
  const status = useOnchain((s) => s.status);
  const address = useOnchain((s) => s.address);
  const chainId = useOnchain((s) => s.chainId);
  const vibenetEth = useOnchain((s) => s.vibenetEth);
  const vibenetUsdv = useOnchain((s) => s.vibenetUsdv);
  const vibenetDrip = useOnchain((s) => s.vibenetDrip);
  const connectVibenet = useOnchain((s) => s.connectVibenet);
  const dripVibenet = useOnchain((s) => s.dripVibenet);
  const switchBase = useOnchain((s) => s.switchBase);
  const refreshVibenet = useOnchain((s) => s.refreshVibenet);
  const [poolLive, setPoolLive] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const onPool = chainId === VIBENET_ID;

  useEffect(() => {
    void vibenetHealth().then(setPoolLive);
  }, []);

  useEffect(() => {
    if (address) void refreshVibenet();
  }, [address, refreshVibenet]);

  async function onConnect() {
    setBusy("connect");
    const ok = await connectVibenet();
    setBusy(null);
    if (ok) toast("Vibenet pool live");
    else toast(useOnchain.getState().error || "Could not add Vibenet");
  }

  async function onDrip() {
    setBusy("drip");
    const hash = await dripVibenet();
    setBusy(null);
    if (hash) toast("Faucet dripped ETH on Vibenet");
    else toast(useOnchain.getState().error || "Faucet refused");
  }

  async function onBase() {
    setBusy("base");
    const ok = await switchBase();
    setBusy(null);
    if (ok) toast("Back on Base · mint is live");
    else toast(useOnchain.getState().error || "Could not switch to Base");
  }

  return (
    <div className="mt-6 rounded-md bg-void px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-gold">
            Vibenet pool
          </p>
          <p className="mt-1 text-sm text-ash">
            Test ETH, USDV, NFV on Base’s live pool. Production 1/1s stamp on
            Base — Vibenet can reset.
          </p>
        </div>
        <span className="rounded-full bg-gold/15 px-2 py-1 text-xs uppercase tracking-[0.14em] text-gold">
          {poolLive ? "Pool live" : chainLabel(chainId)}
        </span>
      </div>

      {address ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-sm bg-obsidian px-3 py-2">
            <p className="text-xs uppercase tracking-[0.16em] text-ash">
              Pool ETH
            </p>
            <p className="font-sans text-lg tabular-nums text-ivory">
              {formatEth(vibenetEth)}
            </p>
          </div>
          <div className="rounded-sm bg-obsidian px-3 py-2">
            <p className="text-xs uppercase tracking-[0.16em] text-ash">USDV</p>
            <p className="font-sans text-lg tabular-nums text-ivory">
              {vibenetUsdv.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!ready || Boolean(busy) || status === "connecting"}
          onClick={() => void onConnect()}
        >
          {busy === "connect" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Waves className="size-3.5" />
          )}
          {onPool ? "Pool connected" : "Connect pool"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={Boolean(busy)}
          onClick={() => void onDrip()}
        >
          {busy === "drip" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Droplets className="size-3.5" />
          )}
          Drip ETH
        </Button>
        {onPool ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={Boolean(busy)}
            onClick={() => void onBase()}
          >
            {busy === "base" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : null}
            Back to Base
          </Button>
        ) : null}
        <Button asChild variant="ghost" size="sm">
          <a href={VIBENET_FAUCET} target="_blank" rel="noreferrer">
            USDV · NFV
            <ExternalLink className="size-3" />
          </a>
        </Button>
      </div>

      {vibenetDrip ? (
        <a
          href={vibenetTx(vibenetDrip)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-gold"
        >
          Last drip {shortAddr(vibenetDrip)}
          <ExternalLink className="size-3" />
        </a>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-3">
        <a
          href={VIBENET_HUB}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center text-xs uppercase tracking-[0.14em] text-gold"
        >
          Pool
          <ExternalLink className="ml-1 size-3" />
        </a>
        <a
          href={vibenetToken(VIBENET_USDV)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center text-xs uppercase tracking-[0.14em] text-gold"
        >
          USDV
        </a>
        <a
          href={vibenetToken(VIBENET_NFV)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center text-xs uppercase tracking-[0.14em] text-gold"
        >
          NFV
        </a>
      </div>
    </div>
  );
}
