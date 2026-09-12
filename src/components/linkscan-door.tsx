import { useEffect, useState } from "react";
import { ExternalLink, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { linkscanDoor } from "@/lib/linkscan";
import { HOUSE } from "@/lib/site";
import { useIam } from "@/lib/store";

export function LinkscanDoor() {
  const cash = useIam((s) => s.profile.links.cashapp);
  const [href, setHref] = useState(() =>
    linkscanDoor({
      cashtag: cash,
      returnTo: `${HOUSE.web}/scan`,
    }),
  );

  useEffect(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : HOUSE.web;
    setHref(
      linkscanDoor({
        cashtag: cash,
        returnTo: `${origin.replace(/\/$/, "")}/scan`,
      }),
    );
  }, [cash]);

  return (
    <section className="rounded-lg bg-obsidian p-4 foil-frame sm:p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-gold">LinkScan</p>
      <h2 className="mt-1 flex items-center gap-2 font-display text-lg tracking-[0.12em] text-ivory uppercase sm:text-xl">
        <ScanLine className="size-4 text-magenta" />
        Sister scanner
      </h2>
      <p className="mt-2 max-w-xl text-sm text-ash">
        QR plus 1D barcodes — UPC, EAN, Code 128. Cash App pay links and NFT
        URLs. A hit on LinkScan comes back to this booth. Your cashtag rides
        over if the house has one.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild>
          <a href={href} target="_blank" rel="noreferrer">
            Open LinkScan
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={HOUSE.linkscanHub} target="_blank" rel="noreferrer">
            Hub
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      </div>
    </section>
  );
}
