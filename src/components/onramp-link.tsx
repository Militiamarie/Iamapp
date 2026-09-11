import type { ReactNode } from "react";
import { openHouseOnramp } from "@/lib/cdp-session";
import type { OnrampAsset } from "@/lib/onramp";
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
    <button
      type="button"
      className={cn("cursor-pointer text-left", className)}
      onClick={() => void openHouseOnramp({ asset, amountUsd, address })}
    >
      {children}
    </button>
  );
}