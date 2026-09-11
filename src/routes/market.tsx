import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { CatalogCard } from "@/components/catalog-card";
import { Input } from "@/components/ui/input";
import { mergeCatalog } from "@/lib/catalog";
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

  return (
    <div className="pt-6 sm:pt-10">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
        Catalog
      </p>
      <h1 className="mt-1 text-3xl text-ivory uppercase sm:text-4xl">Market</h1>
      <p className="mt-2 max-w-xl text-sm text-ash">
        Playable 1/1 music NFTs — collect, share the drop, trade on OpenSea.
        MetaMask, Coinbase Wallet, or the house vault. Press your own in the{" "}
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
