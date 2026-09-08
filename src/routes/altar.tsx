import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ExternalLink,
  ScanLine,
  Stamp,
  Wallet as WalletIcon,
} from "lucide-react";
import { CollectCard } from "@/components/collect-card";
import { RailQr } from "@/components/rail-qr";
import { Button } from "@/components/ui/button";
import { formatEth, formatUsdc, shortAddr } from "@/lib/format";
import {
  cashAppHome,
  coinbaseBuyEth,
  coinbaseBuyUsdc,
  coinbaseWallet,
  openSeaCreate,
  openSeaHome,
} from "@/lib/onramp";
import { cashPayUrl, houseRails, openSeaUrl } from "@/lib/rails";
import { useIam } from "@/lib/store";

export const Route = createFileRoute("/altar")({ component: Altar });

function Altar() {
  const wallet = useIam((s) => s.wallet);
  const connect = useIam((s) => s.connect);
  const profile = useIam((s) => s.profile);
  const collects = useIam((s) => s.collects);
  const minted = useIam((s) => s.minted);
  const rails = houseRails(profile);
  const cash = profile.links.cashapp.trim();
  const os = profile.links.opensea.trim();
  const openSeaProfile = os ? openSeaUrl(os) : openSeaHome();

  return (
    <div className="pt-6 sm:pt-10">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
        One house
      </p>
      <h1 className="mt-1 text-3xl text-ivory uppercase sm:text-4xl">Altar</h1>
      <p className="mt-2 max-w-xl text-sm text-ash">
        Studio, OpenSea, and the on-ramp in one nave. Demo vault collects here.
        Coinbase, Cash App, and OpenSea are the live rails.
      </p>

      <section className="mt-8 rounded-lg bg-obsidian p-4 foil-frame sm:p-5">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold">
          Vault
        </p>
        {wallet.connected ? (
          <>
            <p className="mt-2 font-mono text-xs text-ash">
              {shortAddr(wallet.address)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-sm bg-void px-3 py-3">
                <p className="text-[0.6rem] uppercase tracking-[0.16em] text-ash">
                  USDC
                </p>
                <p className="font-sans text-lg tabular-nums text-ivory">
                  {formatUsdc(wallet.usdc)}
                </p>
              </div>
              <div className="rounded-sm bg-void px-3 py-3">
                <p className="text-[0.6rem] uppercase tracking-[0.16em] text-ash">
                  ETH
                </p>
                <p className="font-sans text-lg tabular-nums text-ivory">
                  {formatEth(wallet.eth)}
                </p>
              </div>
            </div>
          </>
        ) : (
          <Button className="mt-3" onClick={() => connect()}>
            <WalletIcon className="size-3.5" />
            Connect vault
          </Button>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg text-ivory uppercase">On-ramp</h2>
        <p className="mt-1 max-w-xl text-sm text-ash">
          Buy USDC or ETH on Coinbase. Cash App for the door. Nothing is
          custodied in this house.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <RailCard
            kicker="Coinbase"
            title="Buy USDC"
            body="On-ramp dollars to the rail the market settles on."
            href={coinbaseBuyUsdc()}
          />
          <RailCard
            kicker="Coinbase"
            title="Buy ETH"
            body="On-ramp ether. Use it on the altar or send from Coinbase Wallet."
            href={coinbaseBuyEth()}
          />
          <RailCard
            kicker="Coinbase"
            title="Wallet"
            body="Open Coinbase Wallet to send, swap, or hold."
            href={coinbaseWallet()}
          />
          <RailCard
            kicker="Cash App"
            title={cash ? `$${cash.replace(/^\$/, "")}` : "Open Cash App"}
            body="Pay at the door. Flash the house QR from Scan me."
            href={cash ? cashPayUrl(cash.replace(/^\$/, "")) : cashAppHome()}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg text-ivory uppercase">OpenSea</h2>
        <p className="mt-1 max-w-xl text-sm text-ash">
          List a 1/1, open the house profile, or trade a scan. Receipts stay in
          Collect.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <a href={openSeaCreate()} target="_blank" rel="noreferrer">
              List on OpenSea
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={openSeaProfile} target="_blank" rel="noreferrer">
              OpenSea profile
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/scan">
              <ScanLine className="size-3.5" />
              Scan a listing
            </Link>
          </Button>
        </div>
        {minted.length > 0 ? (
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-gold">
            {minted.length} pressed 1/1 ready to list
          </p>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="text-lg text-ivory uppercase">Studio</h2>
        <p className="mt-1 max-w-xl text-sm text-ash">
          Drop a tape or record in the booth. Stamp a playable 1/1 into the
          market and the vault.
        </p>
        <Button asChild className="mt-4">
          <Link to="/mint">
            <Stamp className="size-3.5" />
            Open studio
          </Link>
        </Button>
      </section>

      {rails.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg text-ivory uppercase">House rails</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {rails.map((r) => (
              <RailQr key={r.label} rail={r} />
            ))}
          </div>
        </section>
      ) : (
        <p className="mt-8 text-sm text-ash">
          Add Cash App, Coinbase, and OpenSea in{" "}
          <Link to="/house" className="text-gold">
            the house
          </Link>{" "}
          so collectors can pay you on the live rails.
        </p>
      )}

      {collects.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg text-ivory uppercase">Collect</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {collects.slice(0, 6).map((c) => (
              <li key={c.id}>
                <CollectCard collect={c} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function RailCard({
  kicker,
  title,
  body,
  href,
}: {
  kicker: string;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-lg bg-obsidian p-4 foil-frame sm:p-5"
    >
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-magenta">
        {kicker}
      </p>
      <h3 className="mt-1 flex items-center gap-2 text-lg text-ivory uppercase">
        {title}
        <ExternalLink className="size-3.5 text-gold" />
      </h3>
      <p className="mt-2 text-sm text-ash">{body}</p>
    </a>
  );
}
