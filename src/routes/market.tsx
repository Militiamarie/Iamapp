import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { CatalogCard } from "@/components/catalog-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mergeCatalog } from "@/lib/catalog";
import { useOnchain } from "@/lib/onchain";
import { KINDS } from "@/lib/types";
import { useIam } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/market")({ component: Market });

function Market() {
  const minted = useIam((s) => s.minted);
  const catalog = useMemo(() => mergeCatalog(minted), [minted]);
  const [kind, setKind] = useState<string>("all");
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    return catalog.filter((item) => {
      if (kind !== "all" && item.kind !== kind) return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.creator.toLowerCase().includes(query) ||
        item.blurb.toLowerCase().includes(query)
      );
    });
  }, [catalog, kind, q]);
  const collection = useOnchain((s) => s.collection);
  const tapeVersion = useOnchain((s) => s.tapeVersion);
  const foreign = useOnchain((s) => s.foreign);
  const [bring, setBring] = useState("");
  const [busy, setBusy] = useState<"altar" | "bring" | null>(null);
  const houseLive = tapeVersion === 2 && Boolean(collection);

  return (
    <div className="pt-6 sm:pt-10">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
        Catalog
      </p>
      <h1 className="mt-1 text-3xl text-ivory uppercase sm:text-4xl">Market</h1>
      <p className="mt-2 max-w-xl text-sm text-ash">
        Playable 1/1s on one Base contract. OpenSea, Coinbase Wallet, and any
        other app trade that same token. Paste a token from anywhere and it
        lands here as itself. Press your own in the{" "}
        <Link to="/mint" className="text-gold">
          studio
        </Link>
        . Live rails in{" "}
        <Link to="/productions" className="text-gold">
          Productions
        </Link>
        .
      </p>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ash" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, house, or line"
          className="pl-10"
          aria-label="Search market"
        />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <FilterChip
          label="All"
          active={kind === "all"}
          onClick={() => setKind("all")}
        />
        {KINDS.map((k) => (
          <FilterChip
            key={k.id}
            label={k.label}
            active={kind === k.id}
            onClick={() => setKind(k.id)}
          />
        ))}
      </div>

      <div className="mt-6 rounded-lg bg-obsidian p-4 foil-frame">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">
          One contract
        </p>
        <p className="mt-2 max-w-xl text-sm text-ash">
          {houseLive
            ? `House contract ${collection}. Every stamped 1/1 is that contract plus its token number. Sell it on OpenSea and the wallet that buys it holds the same token.`
            : "Nothing is tradable until you stamp. Your wallet deploys the I AM contract and mints each tape to you. After that, OpenSea and every other app see the same tokens."}
        </p>
        <Button
          className="mt-4"
          disabled={busy === "altar"}
          onClick={async () => {
            setBusy("altar");
            const chain = useOnchain.getState();
            if (!chain.address) {
              const ok = await chain.connect();
              if (!ok) {
                setBusy(null);
                toast(useOnchain.getState().error || "Connect a wallet first");
                return;
              }
            }
            const n = await useOnchain.getState().stampHouse(
              catalog.map((item) => ({
                title: item.title,
                blurb: item.blurb,
                image: item.image,
                kind: item.kind,
                creator: item.creator,
                youtubeId: item.youtubeId,
                itemId: item.id,
                hosted: true,
              })),
            );
            setBusy(null);
            const err = useOnchain.getState().error;
            if (err && n === 0) toast(err);
            else toast(n ? `Stamped ${n} on Base` : "Altar already on the contract");
          }}
        >
          {busy === "altar" ? "Stamping the altar" : "Stamp every 1/1"}
        </Button>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy("bring");
            const row = await useOnchain.getState().bringIn(bring);
            setBusy(null);
            if (!row) toast(useOnchain.getState().error || "Not a token link");
            else {
              toast(`${row.title} is in the house`);
              setBring("");
            }
          }}
        >
          <Input
            value={bring}
            onChange={(e) => setBring(e.target.value)}
            placeholder="OpenSea, Blur, or contract/token"
            aria-label="Bring a token from another app"
          />
          <Button type="submit" variant="outline" disabled={busy === "bring" || !bring.trim()}>
            Bring it in
          </Button>
        </form>
        {foreign.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {foreign.slice(0, 6).map((row) => (
              <li
                key={`${row.chain}:${row.contract}:${row.tokenId}`}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ivory">{row.title}</p>
                  <p className="truncate font-mono text-xs text-ash">
                    {row.chain} · {row.contract.slice(0, 6)}…{row.contract.slice(-4)} · #{row.tokenId}
                  </p>
                </div>
                <a
                  href={row.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs uppercase tracking-[0.14em] text-gold"
                >
                  Trade
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-12 text-sm text-ash">Nothing on the altar matches.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {items.map((item) => (
            <CatalogCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 shrink-0 rounded-full px-4 text-xs uppercase tracking-[0.16em] transition-[background-color,color,box-shadow] duration-(--motion-quick)",
        active
          ? "bg-gold text-void"
          : "bg-transparent text-ash shadow-[0_0_0_1px_var(--color-border)] hover:text-ivory",
      )}
    >
      {label}
    </button>
  );
}
