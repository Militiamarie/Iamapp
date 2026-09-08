import { useEffect, useRef, useState } from "react";
import { Copy, ExternalLink, Unplug, Wallet } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatEth, formatUsdc, shortAddr } from "@/lib/format";
import { coinbaseBuyEth, coinbaseBuyUsdc, openSeaCreate } from "@/lib/onramp";
import { useIam } from "@/lib/store";

export function WalletButton() {
  const ready = useIam((s) => s.ready);
  const wallet = useIam((s) => s.wallet);
  const connect = useIam((s) => s.connect);
  const disconnect = useIam((s) => s.disconnect);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!ready) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Wallet className="size-3.5" />
        Connect
      </Button>
    );
  }

  if (!wallet.connected) {
    return (
      <Button variant="outline" size="sm" onClick={() => connect()}>
        <Wallet className="size-3.5" />
        Connect
      </Button>
    );
  }

  return (
    <div ref={root} className="relative">
      <Button
        variant="void"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="size-1.5 rounded-full bg-gold" />
        <span className="font-mono text-[0.7rem] tracking-wide">
          {shortAddr(wallet.address)}
        </span>
      </Button>
      {open ? (
        <div className="absolute top-[calc(100%+8px)] right-0 z-30 w-72 rounded-lg bg-surface p-3 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_35%,transparent),0_18px_40px_-20px_rgb(0_0_0_/_0.8)]">
          <p className="font-mono text-[0.7rem] break-all text-ash">
            {wallet.address}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-sm bg-void px-2 py-2">
              <p className="text-[0.6rem] uppercase tracking-[0.16em] text-ash">
                USDC
              </p>
              <p className="font-sans text-sm tabular-nums text-ivory">
                {formatUsdc(wallet.usdc).replace(" USDC", "")}
              </p>
            </div>
            <div className="rounded-sm bg-void px-2 py-2">
              <p className="text-[0.6rem] uppercase tracking-[0.16em] text-ash">
                ETH
              </p>
              <p className="font-sans text-sm tabular-nums text-ivory">
                {formatEth(wallet.eth)}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={coinbaseBuyUsdc()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-1 rounded-sm px-2 text-[0.65rem] uppercase tracking-[0.12em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent)]"
            >
              Buy USDC
              <ExternalLink className="size-3" />
            </a>
            <a
              href={coinbaseBuyEth()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-1 rounded-sm px-2 text-[0.65rem] uppercase tracking-[0.12em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent)]"
            >
              Buy ETH
              <ExternalLink className="size-3" />
            </a>
          </div>
          <div className="mt-2 flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <a href={openSeaCreate()} target="_blank" rel="noreferrer">
                OpenSea
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link to="/altar" onClick={() => setOpen(false)}>
                Altar
              </Link>
            </Button>
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={async () => {
                await navigator.clipboard.writeText(wallet.address);
                toast("Address copied");
                setOpen(false);
              }}
            >
              <Copy className="size-3.5" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => {
                disconnect();
                setOpen(false);
                toast("Vault closed");
              }}
            >
              <Unplug className="size-3.5" />
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
