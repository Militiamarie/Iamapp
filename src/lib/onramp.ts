export type OnrampAsset = "USDC" | "ETH";

export function coinbaseOnramp(opts?: {
  asset?: OnrampAsset;
  amountUsd?: number;
  address?: string;
}) {
  const params = new URLSearchParams();
  params.set("fiatCurrency", "USD");
  params.set("defaultAsset", opts?.asset === "ETH" ? "ETH" : "USDC");
  if (opts?.amountUsd && opts.amountUsd > 0) {
    params.set("presetFiatAmount", String(Math.max(1, Math.round(opts.amountUsd))));
  }
  if (opts?.address) {
    params.set(
      "destinationWallets",
      JSON.stringify([
        {
          address: opts.address,
          blockchains: ["base", "ethereum"],
        },
      ]),
    );
  }
  return `https://pay.coinbase.com/buy?${params.toString()}`;
}

export function coinbaseBuyUsdc(address?: string) {
  return coinbaseOnramp({ asset: "USDC", address });
}

export function coinbaseBuyEth(address?: string) {
  return coinbaseOnramp({ asset: "ETH", address });
}

export function coinbaseWallet() {
  return "https://wallet.coinbase.com/";
}

export function coinbaseTrade(pair: "ETH-USD" | "USDC-USD" = "ETH-USD") {
  return `https://www.coinbase.com/advanced-trade/spot/${pair}`;
}

export function cashAppHome() {
  return "https://cash.app/";
}

export function openSeaHome() {
  return "https://opensea.io/";
}

export function openSeaCreate() {
  return "https://opensea.io/create";
}

export function openSeaStudio() {
  return "https://opensea.io/studio";
}

export function openSeaSearch(q: string) {
  return `https://opensea.io/explore?search=${encodeURIComponent(q)}`;
}
