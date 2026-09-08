export type InjectedProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
};

export type WalletKind = "metamask" | "coinbase" | "injected" | "demo";

export type AnnouncedWallet = {
  uuid: string;
  name: string;
  rdns: string;
  kind: WalletKind;
  provider: InjectedProvider;
};

export const WALLET_INSTALL = {
  metamask: "https://metamask.io/download/",
  coinbase: "https://www.coinbase.com/wallet/downloads",
} as const;

function kindFrom(rdns: string, name: string, provider: InjectedProvider): WalletKind {
  const n = `${rdns} ${name}`.toLowerCase();
  if (provider.isCoinbaseWallet || n.includes("coinbase")) return "coinbase";
  if (provider.isMetaMask || n.includes("metamask")) return "metamask";
  return "injected";
}

function addTo(
  found: Map<string, AnnouncedWallet>,
  info: { uuid?: string; name?: string; rdns?: string },
  provider: InjectedProvider,
) {
  const rdns = info.rdns || info.name || "injected";
  if (found.has(rdns)) return;
  found.set(rdns, {
    uuid: info.uuid || rdns,
    name: info.name || "Wallet",
    rdns,
    kind: kindFrom(rdns, info.name || "", provider),
    provider,
  });
}

function collectLegacy(found: Map<string, AnnouncedWallet>) {
  const eth = (window as Window & {
    ethereum?: InjectedProvider & { providers?: InjectedProvider[] };
  }).ethereum;
  if (!eth) return;
  const list = eth.providers?.length ? eth.providers : [eth];
  for (const provider of list) {
    addTo(
      found,
      {
        uuid: provider.isCoinbaseWallet
          ? "legacy-coinbase"
          : provider.isMetaMask
            ? "legacy-metamask"
            : "legacy",
        name: provider.isCoinbaseWallet
          ? "Coinbase Wallet"
          : provider.isMetaMask
            ? "MetaMask"
            : "Browser wallet",
        rdns: provider.isCoinbaseWallet
          ? "com.coinbase.wallet"
          : provider.isMetaMask
            ? "io.metamask"
            : "legacy",
      },
      provider,
    );
  }
}

export function discoverWallets(): AnnouncedWallet[] {
  if (typeof window === "undefined") return [];
  const found = new Map<string, AnnouncedWallet>();

  const onAnnounce = (event: Event) => {
    const detail = (event as CustomEvent).detail as
      | { info?: { uuid?: string; name?: string; rdns?: string }; provider?: InjectedProvider }
      | undefined;
    if (detail?.provider) addTo(found, detail.info ?? {}, detail.provider);
  };

  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  window.removeEventListener("eip6963:announceProvider", onAnnounce);
  collectLegacy(found);
  return [...found.values()];
}

export function subscribeWallets(cb: (wallets: AnnouncedWallet[]) => void) {
  if (typeof window === "undefined") return () => {};
  const found = new Map<string, AnnouncedWallet>();
  const emit = () => cb([...found.values()]);

  const onAnnounce = (event: Event) => {
    const detail = (event as CustomEvent).detail as
      | { info?: { uuid?: string; name?: string; rdns?: string }; provider?: InjectedProvider }
      | undefined;
    if (detail?.provider) addTo(found, detail.info ?? {}, detail.provider);
    emit();
  };

  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  collectLegacy(found);
  emit();
  return () => window.removeEventListener("eip6963:announceProvider", onAnnounce);
}

export async function requestAccount(provider: InjectedProvider) {
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];
  const address = accounts?.[0];
  if (!address) throw new Error("No account returned");
  return address;
}

export function providerLabel(kind: string) {
  if (kind === "metamask") return "MetaMask";
  if (kind === "coinbase") return "Coinbase Wallet";
  if (kind === "injected") return "Browser wallet";
  if (kind === "demo") return "House vault";
  return "Vault";
}
