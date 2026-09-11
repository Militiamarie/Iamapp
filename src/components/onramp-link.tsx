import type { ReactNode } from "react";
import { openHouseOnramp } from "@/lib/cdp-session";
import { coinbaseOnramp, type OnrampAsset } from "@/lib/onramp";
import { cn } from "@/lib/utils";

export function OnrampLink({
  asset,
  amountUsd,
  address,
  className,
  children,
}: {
  asset?: OnrampAsset;
  amountUsd?: number;
  address?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={coinbaseOnramp({ asset, amountUsd, address })}
      target="_blank"
      rel="noreferrer"
      className={cn("cursor-pointer text-left", className)}
      onClick={(e) => {
        e.preventDefault();
        void openHouseOnramp({ asset, amountUsd, address });
      }}
    >
      {children}
    </a>
  );
}