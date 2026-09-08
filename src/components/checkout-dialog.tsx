import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatEth, formatRail, formatUsdc, usdcToEth } from "@/lib/format";
import { cashAppHome, coinbaseBuyEth, coinbaseBuyUsdc } from "@/lib/onramp";
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
  const connect = useIam((s) => s.connect);
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
          {blurb ? ` — ${blurb}` : ""} Demo vault here. Coinbase / Cash App for
          live rails.
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
            <p className="text-xs text-ash">
              Connect a demo wallet to settle in the house.
            </p>
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
          ) : (
            <Button
              variant="gold"
              className="mt-1 w-full"
              onClick={() => {
                connect();
                setError(null);
              }}
            >
              Connect vault
            </Button>
          )}

          {!afford && wallet.connected ? (
            <div className="mt-1 flex flex-col gap-2">
              <p className="text-[0.65rem] uppercase tracking-[0.16em] text-gold">
                On-ramp
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={rail === "ETH" ? coinbaseBuyEth() : coinbaseBuyUsdc()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs uppercase tracking-[0.14em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_55%,transparent)]"
                >
                  Buy {rail} on Coinbase
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
          ) : null}
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
