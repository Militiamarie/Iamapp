import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { CatalogCard } from "@/components/catalog-card";
import { Button } from "@/components/ui/button";
import { mergeCatalog } from "@/lib/catalog";
import { formatRail } from "@/lib/format";
import { useIam } from "@/lib/store";

export const Route = createFileRoute("/vault")({ component: Vault });

function Vault() {
  const ready = useIam((s) => s.ready);
  const owned = useIam((s) => s.owned);
  const tickets = useIam((s) => s.tickets);
  const minted = useIam((s) => s.minted);
  const catalog = useMemo(() => mergeCatalog(minted), [minted]);
  const items = owned
    .map((o) => {
      const item = catalog.find((c) => c.id === o.itemId);
      return item ? { item, rec: o } : null;
    })
    .filter(Boolean);

  return (
    <div className="pt-6 sm:pt-10">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
        Collection
      </p>
      <h1 className="mt-1 text-3xl text-ivory uppercase sm:text-4xl">Vault</h1>
      <p className="mt-2 max-w-xl text-sm text-ash">
        Pieces you collected or pressed live on this device. Play them. Stage
        tickets sit beside them. List a 1/1 from the{" "}
        <Link to="/altar" className="text-gold">
          altar
        </Link>
        .
      </p>

      {ready && items.length === 0 ? (
        <div className="mt-12 max-w-md">
          <p className="text-sm text-ash">The vault is empty.</p>
          <Button asChild className="mt-4">
            <Link to="/market">Enter the market</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {items.map((row) =>
            row ? (
              <div key={row.rec.itemId + row.rec.at} className="flex flex-col">
                <CatalogCard item={row.item} />
                <p className="mt-2 text-[0.65rem] uppercase tracking-[0.14em] text-ash">
                  Paid {formatRail(row.rec.rail, row.rec.paidUsdc)}
                </p>
              </div>
            ) : null,
          )}
        </div>
      )}

      {tickets.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-lg text-ivory uppercase">Rite tickets</h2>
          <ul className="mt-3 divide-y divide-border rounded-lg bg-obsidian foil-frame">
            {tickets.map((t) => (
              <li
                key={t.showId}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="text-ivory">{t.showId.replace("rite-", "")}</span>
                <span className="tabular-nums text-gold">
                  {formatRail(t.rail, t.paidUsdc)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
