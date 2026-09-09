import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { WalletChoices } from "@/components/wallet-button";
import { formatEth, formatRail, formatUsdc, usdcToEth } from "@/lib/format";
import { cashAppHome, coinbaseOnramp, openSeaCreate } from "@/lib/onramp";
import { cashPayUrl } from "@/lib/rails";
import { useIam } from "@/lib/store";
import type { Rail } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CheckoutDialog({
  open,
  onOpenChange,
  title,
  blurb,
  priceUsdc,
  confirmLabel = "Pay the altar",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  blurb?: string;
  priceUsdc: number;
  confirmLabel?: string;
  onConfirm: (rail: Rail) => boolean;
}) {
  const wallet = useIam((s) => s.wallet);
  const profile = useIam((s) => s.profile);
  const [rail, setRail] = useState<Rail>("USDC");
  const [error, setError] = useState<string | null>(null);

  const afford =
    rail === "USDC"
      ? wallet.usdc >= priceUsdc
      : wallet.eth >= usdcToEth(priceUsdc);

  const cash = profile.links.cashapp.trim();

  function handleConfirm() {
    setError(null);
    const ok = onConfirm(rail);
    if (!ok) {
      setError(
        wallet.connected
          ? "Not enough on this rail. On-ramp below."
          : "Connect the vault first.",
      );
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogTitle>Checkout</DialogTitle>
        <DialogDescription>
          {title}
          {blurb ? ` — ${blurb}` : ""} Collect as a 1/1. List on OpenSea after.
          Coinbase / Cash App for live rails.
        </DialogDescription>

        <div className="mt-4 flex flex-col gap-3">
          <p className="font-display text-2xl tracking-[0.12em] text-ivory">
            {formatRail(rail, priceUsdc)}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <RailChoice
              active={rail === "USDC"}
              label="USDC"
              amount={formatUsdc(priceUsdc)}
              onClick={() => setRail("USDC")}
            />
            <RailChoice
              active={rail === "ETH"}
              label="ETH"
              amount={formatEth(usdcToEth(priceUsdc))}
              onClick={() => setRail("ETH")}
            />
          </div>

          {wallet.connected ? (
            <p className="text-xs tabular-nums text-ash">
              Vault · {formatUsdc(wallet.usdc)} · {formatEth(wallet.eth)}
            </p>
          ) : (
            <WalletChoices />
          )}

          {error ? <p className="text-xs text-magenta">{error}</p> : null}

          {wallet.connected ? (
            <Button
              variant="gold"
              className="mt-1 w-full"
              disabled={!afford}
              onClick={handleConfirm}
            >
              {afford ? confirmLabel : "Insufficient"}
            </Button>
          ) : null}

          <a
            href={openSeaCreate()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md px-3 text-xs uppercase tracking-[0.14em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_55%,transparent)]"
          >
            List on OpenSea · 10% royalty
            <ExternalLink className="size-3" />
          </a>

          <div className="mt-2 flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.16em] text-gold">
              Coinbase Onramp
            </p>
            <p className="text-xs text-ash">
              Buy {rail} on Coinbase, then mint or trade on-chain. Demo vault
              above. Live rails below.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={coinbaseOnramp({
                  asset: rail,
                  amountUsd: priceUsdc,
                  address: wallet.connected ? wallet.address : undefined,
                })}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs uppercase tracking-[0.14em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_55%,transparent)]"
              >
                Buy {rail} on Coinbase
                <ExternalLink className="size-3" />
              </a>
              <a
                href={openSeaCreate()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs uppercase tracking-[0.14em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_55%,transparent)]"
              >
                Mint on OpenSea
                <ExternalLink className="size-3" />
              </a>
              <a
                href={
                  cash
                    ? cashPayUrl(cash.replace(/^\$/, ""), priceUsdc)
                    : cashAppHome()
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs uppercase tracking-[0.14em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_55%,transparent)]"
              >
                Cash App
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RailChoice({
  active,
  label,
  amount,
  onClick,
}: {
  active: boolean;
  label: string;
  amount: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-14 flex-col items-start rounded-md px-3 py-2 text-left transition-[box-shadow,background-color] duration-(--motion-quick) ease-(--ease-out)",
        active
          ? "bg-raised shadow-[0_0_0_1px_var(--color-gold)]"
          : "bg-void shadow-[0_0_0_1px_var(--color-border)] hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent)]",
      )}
    >
      <span className="text-[0.65rem] uppercase tracking-[0.18em] text-ash">
        {label}
      </span>
      <span className="font-sans text-sm tabular-nums text-ivory">{amount}</span>
    </button>
  );
}
