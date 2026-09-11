import { useState } from "react";
import { ExternalLink, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { basescanTx, isEthAddress } from "@/lib/chain";
import { formatEth, formatUsdc, shortAddr } from "@/lib/format";
import { useOnchain, type ChainSend } from "@/lib/onchain";
import { cn } from "@/lib/utils";

export function SendRail({
  to: givenTo,
  compact = false,
}: {
  to?: string;
  compact?: boolean;
}) {
  const ready = useOnchain((s) => s.ready);
  const status = useOnchain((s) => s.status);
  const address = useOnchain((s) => s.address);
  const eth = useOnchain((s) => s.eth);
  const usdc = useOnchain((s) => s.usdc);
  const connect = useOnchain((s) => s.connect);
  const sendOnchain = useOnchain((s) => s.sendOnchain);
  const [to, setTo] = useState(givenTo ?? "");
  const [amount, setAmount] = useState(givenTo ? "1" : "0.001");
  const [asset, setAsset] = useState<"ETH" | "USDC">(givenTo ? "USDC" : "ETH");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<ChainSend | null>(null);

  const dest = (givenTo || to).trim();
  const canSend = Boolean(address) && isEthAddress(dest) && Number(amount) > 0;

  async function onSend() {
    if (!address) {
      const ok = await connect();
      if (!ok) {
        toast(useOnchain.getState().error || "Connect a wallet first");
        return;
      }
    }
    setBusy(true);
    const row = await sendOnchain({
      to: dest,
      amount,
      asset,
    });
    setBusy(false);
    if (!row) {
      toast(useOnchain.getState().error || "Send failed");
      return;
    }
    setLast(row);
    toast(`Sent ${row.amount} ${row.asset} on Base`);
  }

  return (
    <div className={compact ? "mt-4" : "mt-6"}>
      <p className="text-xs uppercase tracking-[0.16em] text-gold">Send</p>
      <p className="mt-1 text-sm text-ash">
        Live payment on Base. ETH or USDC leaves your wallet. This house never
        holds it.
      </p>
      {!address ? (
        <Button
          type="button"
          className="mt-3 w-full"
          disabled={!ready || status === "connecting"}
          onClick={() => void connect()}
        >
          {status === "connecting" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          Connect to send
        </Button>
      ) : (
        <form
          className="mt-3 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSend && !busy) void onSend();
          }}
        >
          {givenTo ? (
            <p className="break-all font-mono text-xs text-ash">
              To {shortAddr(givenTo)}
            </p>
          ) : (
            <div>
              <Label htmlFor="send-to">To</Label>
              <Input
                id="send-to"
                autoComplete="off"
                spellCheck={false}
                placeholder="0x…"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          )}
          <div className="flex gap-2">
            {(["ETH", "USDC"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setAsset(a);
                  setAmount(a === "ETH" ? "0.001" : "1");
                }}
                className={cn(
                  "min-h-11 flex-1 rounded-full px-3 text-xs uppercase tracking-[0.14em]",
                  asset === a
                    ? "bg-gold text-void"
                    : "bg-void text-ash shadow-[0_0_0_1px_var(--color-border)]",
                )}
              >
                {a}
              </button>
            ))}
          </div>
          <div>
            <Label htmlFor="send-amt">Amount</Label>
            <Input
              id="send-amt"
              type="number"
              min={0}
              step={asset === "ETH" ? "0.0001" : "0.01"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="mt-1 text-xs text-ash">
              Wallet {formatUsdc(usdc)} · {formatEth(eth)}
            </p>
          </div>
          <Button type="submit" disabled={!canSend || busy} className="w-full">
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Send {asset} on Base
          </Button>
        </form>
      )}
      {last ? (
        <a
          href={basescanTx(last.tx)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-gold"
        >
          Sent {last.amount} {last.asset} · {shortAddr(last.to)}
          <ExternalLink className="size-3" />
        </a>
      ) : null}
    </div>
  );
}
