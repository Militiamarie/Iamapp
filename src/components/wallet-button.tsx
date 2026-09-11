import { useEffect, useRef, useState } from "react";
import { Copy, ExternalLink, Unplug, Wallet } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { coinbaseDappUrl, type Eip1193 } from "@/lib/chain";
import { formatEth, formatUsdc, shortAddr } from "@/lib/format";
import {
  providerLabel,
  requestAccount,
  subscribeWallets,
  WALLET_INSTALL,
  type AnnouncedWallet,
  type WalletKind,
} from "@/lib/injected-wallet";
import { useOnchain } from "@/lib/onchain";
import { openSeaProfile, openSeaWallet } from "@/lib/onramp";
import { OnrampLink } from "@/components/onramp-link";
import { useIam } from "@/lib/store";
import { cn } from "@/lib/utils";

export function WalletButton() {
  const ready = useIam((s) => s.ready);
  const wallet = useIam((s) => s.wallet);
  const houseDisconnect = useIam((s) => s.disconnect);
  const chainReady = useOnchain((s) => s.ready);
  const address = useOnchain((s) => s.address);
  const eth = useOnchain((s) => s.eth);
  const usdc = useOnchain((s) => s.usdc);
  const disconnectOnchain = useOnchain((s) => s.disconnect);
  const [open, setOpen] = useState(false);
  const [picker, setPicker] = useState(false);
  const [dapp, setDapp] = useState("https://go.cb-w.com/dapp");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDapp(coinbaseDappUrl());
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!ready || !chainReady) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Wallet className="size-3.5" />
        Connect
      </Button>
    );
  }

  const connected = Boolean(address) || wallet.connected;
  const shown = address || wallet.address;
  const shownEth = address ? eth : wallet.eth;
  const shownUsdc = address ? usdc : wallet.usdc;
  const live = Boolean(address);

  if (!connected) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setPicker(true)}>
          <Wallet className="size-3.5" />
          Connect
        </Button>
        <WalletConnectDialog open={picker} onOpenChange={setPicker} />
      </>
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
          {shortAddr(shown)}
        </span>
      </Button>
      {open ? (
        <div className="absolute top-[calc(100%+8px)] right-0 z-30 w-72 rounded-lg bg-surface p-3 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_35%,transparent),0_18px_40px_-20px_rgb(0_0_0_/_0.8)]">
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-gold">
            {live ? "Base" : providerLabel(wallet.provider)}
          </p>
          <p className="mt-1 font-mono text-[0.7rem] break-all text-ash">
            {shown}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-sm bg-void px-2 py-2">
              <p className="text-[0.6rem] uppercase tracking-[0.16em] text-ash">
                USDC
              </p>
              <p className="font-sans text-sm tabular-nums text-ivory">
                {formatUsdc(shownUsdc).replace(" USDC", "")}
              </p>
            </div>
            <div className="rounded-sm bg-void px-2 py-2">
              <p className="text-[0.6rem] uppercase tracking-[0.16em] text-ash">
                ETH
              </p>
              <p className="font-sans text-sm tabular-nums text-ivory">
                {formatEth(shownEth)}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <OnrampLink
              asset="USDC"
              address={live ? shown : undefined}
              className="inline-flex min-h-10 items-center justify-center gap-1 rounded-sm px-2 text-[0.65rem] uppercase tracking-[0.12em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent)]"
            >
              Onramp USDC
              <ExternalLink className="size-3" />
            </OnrampLink>
            <OnrampLink
              asset="ETH"
              address={live ? shown : undefined}
              className="inline-flex min-h-10 items-center justify-center gap-1 rounded-sm px-2 text-[0.65rem] uppercase tracking-[0.12em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent)]"
            >
              Onramp ETH
              <ExternalLink className="size-3" />
            </OnrampLink>
          </div>
          <div className="mt-2 flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <a
                href={
                  live && shown
                    ? openSeaWallet(shown)
                    : openSeaProfile()
                }
                target="_blank"
                rel="noreferrer"
              >
                OpenSea
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link to="/productions" onClick={() => setOpen(false)}>
                Productions
              </Link>
            </Button>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2 w-full">
            <a href={dapp} target="_blank" rel="noreferrer">
              Coinbase Wallet
              <ExternalLink className="size-3" />
            </a>
          </Button>
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={async () => {
                await navigator.clipboard.writeText(shown);
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
                disconnectOnchain();
                houseDisconnect();
                setOpen(false);
                toast(live ? "Onchain closed" : "Vault closed");
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

export function WalletConnectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Connect a wallet</DialogTitle>
        <DialogDescription>
          MetaMask, Coinbase Wallet, or any injected wallet. House vault is
          demo USDC / ETH for collecting in this nave.
        </DialogDescription>
        <WalletChoices onConnected={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function WalletChoices({ onConnected }: { onConnected?: () => void }) {
  const connect = useIam((s) => s.connect);
  const connectChain = useIam((s) => s.connectChain);
  const [wallets, setWallets] = useState<AnnouncedWallet[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeWallets(setWallets), []);

  const hasMeta = wallets.some((w) => w.kind === "metamask");
  const hasCoin = wallets.some((w) => w.kind === "coinbase");

  async function attach(wallet: AnnouncedWallet) {
    setBusy(wallet.rdns);
    setError(null);
    try {
      const ok = await useOnchain.getState().connect({
        provider: wallet.provider as Eip1193,
        name: wallet.name,
      });
      const addr = useOnchain.getState().address;
      if (ok && addr) {
        connectChain(addr, wallet.kind);
        toast(`Onchain · ${wallet.name}`);
        onConnected?.();
        return;
      }
      const address = await requestAccount(wallet.provider);
      connectChain(address, wallet.kind);
      toast(`Connected · ${wallet.name}`);
      onConnected?.();
    } catch {
      setError(
        useOnchain.getState().error || "Wallet refused the request.",
      );
    } finally {
      setBusy(null);
    }
  }

  function attachDemo() {
    connect();
    toast("House vault open");
    onConnected?.();
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {wallets.map((w) => (
        <ChoiceRow
          key={w.rdns}
          label={w.name}
          hint={kindHint(w.kind)}
          busy={busy === w.rdns}
          disabled={Boolean(busy)}
          onClick={() => void attach(w)}
        />
      ))}
      {!hasMeta ? (
        <InstallRow label="MetaMask" href={WALLET_INSTALL.metamask} />
      ) : null}
      {!hasCoin ? (
        <InstallRow label="Coinbase Wallet" href={WALLET_INSTALL.coinbase} />
      ) : null}
      <ChoiceRow
        label="House vault"
        hint="Demo USDC / ETH · collect in this nave"
        busy={false}
        disabled={Boolean(busy)}
        onClick={attachDemo}
      />
      {error ? <p className="text-xs text-magenta">{error}</p> : null}
    </div>
  );
}

function kindHint(kind: WalletKind) {
  if (kind === "metamask") return "Injected · Base, ETH, OpenSea";
  if (kind === "coinbase") return "Coinbase Wallet · on-ramp ready";
  return "Any EIP-6963 wallet";
}

function ChoiceRow({
  label,
  hint,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  hint: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-14 flex-col items-start rounded-md bg-void px-3 py-2 text-left shadow-[0_0_0_1px_var(--color-border)] transition-[box-shadow,background-color] duration-(--motion-quick) hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_50%,transparent)] disabled:opacity-60",
      )}
    >
      <span className="text-sm text-ivory">{busy ? "Connecting…" : label}</span>
      <span className="text-[0.65rem] uppercase tracking-[0.14em] text-ash">
        {hint}
      </span>
    </button>
  );
}

function InstallRow({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex min-h-12 items-center justify-between rounded-md px-3 text-xs uppercase tracking-[0.14em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent)]"
    >
      Get {label}
      <ExternalLink className="size-3.5" />
    </a>
  );
}
