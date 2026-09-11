import { createServerFn } from "@tanstack/react-start";
import { coinbaseOnramp, type OnrampAsset } from "./onramp";

export const cdpStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { cdpConfigured } = await import("./cdp-session.server");
  return { ok: cdpConfigured() };
});

export const createOnrampSession = createServerFn({ method: "POST" })
  .validator((input: {
    asset?: OnrampAsset;
    amountUsd?: number;
    address?: string;
  }) => ({
    asset: input.asset === "ETH" ? ("ETH" as const) : ("USDC" as const),
    amountUsd:
      typeof input.amountUsd === "number" && input.amountUsd > 0
        ? input.amountUsd
        : undefined,
    address:
      typeof input.address === "string" ? input.address.trim() : undefined,
  }))
  .handler(async ({ data }) => {
    const { issueOnrampSession } = await import("./cdp-session.server");
    return issueOnrampSession(data);
  });

export async function openHouseOnramp(opts?: {
  asset?: OnrampAsset;
  amountUsd?: number;
  address?: string;
}) {
  try {
    const session = await createOnrampSession({
      data: {
        asset: opts?.asset,
        amountUsd: opts?.amountUsd,
        address: opts?.address,
      },
    });
    if (session.ok && session.url) {
      window.open(session.url, "_blank", "noopener,noreferrer");
      return;
    }
  } catch {
    /* static house has no CDP session — public rail */
  }
  window.open(coinbaseOnramp(opts), "_blank", "noopener,noreferrer");
}