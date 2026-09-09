export const BASE_ID = 8453;
export const BASE_HEX = "0x2105";
export const BASE_RPC = "https://mainnet.base.org";
export const BASE_EXPLORER = "https://basescan.org";
export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

export const BASE_ADD_CHAIN = {
  chainId: BASE_HEX,
  chainName: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: [BASE_RPC],
  blockExplorerUrls: [BASE_EXPLORER],
};

export type Eip1193 = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

type Eip6963Detail = {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: Eip1193;
};

export function discoverWallet(): { provider: Eip1193; name: string } | null {
  if (typeof window === "undefined") return null;
  const found: Eip6963Detail[] = [];
  function on(e: Event) {
    const d = (e as CustomEvent<Eip6963Detail>).detail;
    if (d?.provider) found.push(d);
  }
  window.addEventListener("eip6963:announceProvider", on);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  window.removeEventListener("eip6963:announceProvider", on);
  const cb = found.find((p) => /coinbase/i.test(`${p.info.rdns} ${p.info.name}`));
  const pick = cb ?? found[0];
  if (pick) return { provider: pick.provider, name: pick.info.name };
  const eth = (window as unknown as { ethereum?: Eip1193 }).ethereum;
  if (eth) return { provider: eth, name: "Wallet" };
  return null;
}

export function coinbaseDappUrl(origin?: string) {
  const loc =
    origin ||
    (typeof window !== "undefined" ? window.location.href : "");
  if (!loc) return "https://go.cb-w.com/dapp";
  return `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(loc)}`;
}

export function basescanTx(hash: string) {
  return `${BASE_EXPLORER}/tx/${hash}`;
}

export function basescanToken(contract: string, tokenId?: string) {
  const base = `${BASE_EXPLORER}/token/${contract}`;
  return tokenId ? `${base}?a=${tokenId}` : base;
}

export function openSeaItem(contract: string, tokenId: string) {
  return `https://opensea.io/item/base/${contract}/${tokenId}`;
}

export function openSeaCollection(contract: string) {
  return `https://opensea.io/assets/base/${contract}`;
}
