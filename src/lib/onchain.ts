import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BASE_ADD_CHAIN,
  BASE_HEX,
  BASE_ID,
  BASE_RPC,
  BASE_USDC,
  VIBENET_ADD_CHAIN,
  VIBENET_FAUCET_DRIP,
  VIBENET_HEX,
  VIBENET_ID,
  VIBENET_RPC,
  VIBENET_USDV,
  discoverWallet,
  isEthAddress,
  openSeaItem,
  type Eip1193,
} from "./chain";
import { IAM_TAPE_ABI, IAM_TAPE_BYTECODE } from "./iam-tape";
import { HOUSE } from "./site";

export type ChainMint = {
  tx: string;
  contract: string;
  tokenId: string;
  title: string;
  itemId?: string;
  at: number;
};

export type ChainSend = {
  tx: string;
  to: string;
  amount: string;
  asset: "ETH" | "USDC";
  at: number;
};

export type SendDraft = {
  to: string;
  amount: string;
  asset: "ETH" | "USDC";
};

type OnchainState = {
  ready: boolean;
  status: "idle" | "connecting" | "ready" | "error";
  address?: string;
  chainId?: number;
  walletName?: string;
  eth: number;
  usdc: number;
  vibenetEth: number;
  vibenetUsdv: number;
  vibenetDrip?: string;
  collection?: string;
  collections: Record<string, string>;
  mints: ChainMint[];
  sends: ChainSend[];
  error?: string;
  connect: (given?: { provider: Eip1193; name: string }) => Promise<boolean>;
  connectCoinbase: () => Promise<boolean>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  refreshVibenet: () => Promise<void>;
  switchBase: () => Promise<boolean>;
  connectVibenet: () => Promise<boolean>;
  dripVibenet: () => Promise<string | null>;
  sendOnchain: (draft: SendDraft) => Promise<ChainSend | null>;
  mintTape: (draft: TapeMeta) => Promise<ChainMint | null>;
};

export type TapeMeta = {
  title: string;
  blurb: string;
  image: string;
  kind: string;
  creator: string;
  youtubeId?: string;
  itemId?: string;
};

const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

let provider: Eip1193 | null = null;

function asAddr(v: string) {
  return v.toLowerCase();
}

function metadataUri(draft: TapeMeta) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const image = draft.image.startsWith("data:")
    ? `${origin}/art/emblem.jpg`
    : draft.image.startsWith("http")
      ? draft.image
      : `${origin}${draft.image}`;
  const json = {
    name: draft.title,
    description: draft.blurb,
    image,
    external_url: origin,
    animation_url: draft.youtubeId
      ? `https://www.youtube.com/watch?v=${draft.youtubeId}`
      : undefined,
    attributes: [
      { trait_type: "Kind", value: draft.kind },
      { trait_type: "House", value: "I AM" },
      { trait_type: "Creator", value: draft.creator },
    ],
  };
  const raw = unescape(encodeURIComponent(JSON.stringify(json)));
  return `data:application/json;base64,${btoa(raw)}`;
}

function unknownChain(err: unknown) {
  const e = err as { code?: number | string; message?: string };
  const code = Number(e.code);
  return (
    code === 4902 ||
    /unrecognized chain|chain.*not (added|found)|added to wallet/i.test(
      e.message || "",
    )
  );
}

async function ensureChain(
  eip: Eip1193,
  hex: string,
  add: typeof BASE_ADD_CHAIN,
) {
  const id = await eip.request({ method: "eth_chainId" });
  if (String(id).toLowerCase() === hex.toLowerCase()) return;
  try {
    await eip.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hex }],
    });
  } catch (err) {
    if (unknownChain(err)) {
      await eip.request({
        method: "wallet_addEthereumChain",
        params: [add],
      });
      return;
    }
    throw err;
  }
}

async function ensureBase(eip: Eip1193) {
  await ensureChain(eip, BASE_HEX, BASE_ADD_CHAIN);
}

async function ensureVibenet(eip: Eip1193) {
  await ensureChain(eip, VIBENET_HEX, VIBENET_ADD_CHAIN);
}

async function coinbaseSdkWallet(): Promise<{
  provider: Eip1193;
  name: string;
} | null> {
  if (typeof window === "undefined") return null;
  try {
    const { createCoinbaseWalletSDK } = await import("@coinbase/wallet-sdk");
    const sdk = createCoinbaseWalletSDK({
      appName: HOUSE.productions,
      appLogoUrl: `${window.location.origin}/art/emblem.jpg`,
      appChainIds: [BASE_ID, VIBENET_ID],
      preference: {
        options: "eoaOnly",
        attribution: { auto: true },
      },
    });
    return { provider: sdk.getProvider() as Eip1193, name: "Coinbase Wallet" };
  } catch {
    return null;
  }
}

async function loadViem() {
  return import("viem");
}

const baseChain = {
  id: BASE_ID,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [BASE_RPC] },
  },
} as const;

const vibenetChain = {
  id: VIBENET_ID,
  name: "Base Vibenet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [VIBENET_RPC] },
  },
} as const;

function errMsg(err: unknown) {
  const e = err as { shortMessage?: string; message?: string };
  return e.shortMessage || e.message || "Wallet rejected";
}

async function readChainId(eip: Eip1193 | null) {
  if (!eip) return undefined;
  try {
    return Number(await eip.request({ method: "eth_chainId" }));
  } catch {
    return undefined;
  }
}

export const useOnchain = create<OnchainState>()(
  persist(
    (set, get) => ({
      ready: false,
      status: "idle",
      eth: 0,
      usdc: 0,
      vibenetEth: 0,
      vibenetUsdv: 0,
      collections: {},
      mints: [],
      sends: [],
      connect: async (given) => {
        set({ status: "connecting", error: undefined });
        const found = given ?? discoverWallet() ?? (await coinbaseSdkWallet());
        if (!found) {
          set({
            status: "error",
            error: "No wallet in this window. Open Coinbase Wallet.",
          });
          return false;
        }
        provider = found.provider;
        try {
          const accounts = (await provider.request({
            method: "eth_requestAccounts",
          })) as string[];
          const address = accounts[0] ? asAddr(accounts[0]) : undefined;
          if (!address) throw new Error("No account");
          await ensureBase(provider);
          const chainId = Number(
            await provider.request({ method: "eth_chainId" }),
          );
          const collection = get().collections[address] ?? get().collection;
          set({
            status: "ready",
            address,
            chainId,
            walletName: found.name,
            collection,
            error: undefined,
          });
          await get().refresh();
          return true;
        } catch (err) {
          set({ status: "error", error: errMsg(err) });
          return false;
        }
      },
      connectCoinbase: async () => {
        const sdk = await coinbaseSdkWallet();
        return get().connect(sdk ?? undefined);
      },
      disconnect: () => {
        provider = null;
        set({
          status: "idle",
          address: undefined,
          chainId: undefined,
          walletName: undefined,
          eth: 0,
          usdc: 0,
          vibenetEth: 0,
          vibenetUsdv: 0,
          vibenetDrip: undefined,
          error: undefined,
        });
      },
      refresh: async () => {
        const { address } = get();
        if (!address) return;
        try {
          const { createPublicClient, http, formatEther, formatUnits } =
            await loadViem();
          const publicClient = createPublicClient({
            chain: baseChain,
            transport: http(BASE_RPC),
          });
          const [wei, rawUsdc, chainId] = await Promise.all([
            publicClient.getBalance({ address: address as `0x${string}` }),
            publicClient.readContract({
              address: BASE_USDC,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [address as `0x${string}`],
            }),
            readChainId(provider),
          ]);
          set({
            eth: Number(formatEther(wei)),
            usdc: Number(formatUnits(rawUsdc, 6)),
            chainId: chainId ?? get().chainId,
          });
        } catch {
          /* public rpc blip — keep last */
        }
      },
      refreshVibenet: async () => {
        const { address } = get();
        if (!address) return;
        try {
          const { createPublicClient, http, formatEther, formatUnits } =
            await loadViem();
          const publicClient = createPublicClient({
            chain: vibenetChain,
            transport: http(VIBENET_RPC),
          });
          const [wei, rawUsdv, chainId] = await Promise.all([
            publicClient.getBalance({ address: address as `0x${string}` }),
            publicClient
              .readContract({
                address: VIBENET_USDV,
                abi: ERC20_ABI,
                functionName: "balanceOf",
                args: [address as `0x${string}`],
              })
              .catch(() => 0n),
            readChainId(provider),
          ]);
          set({
            vibenetEth: Number(formatEther(wei)),
            vibenetUsdv: Number(formatUnits(rawUsdv as bigint, 6)),
            chainId: chainId ?? get().chainId,
          });
        } catch {
          /* pool rpc blip */
        }
      },
      switchBase: async () => {
        if (!provider) {
          return get().connect();
        }
        try {
          await ensureBase(provider);
          const chainId = await readChainId(provider);
          set({ chainId, error: undefined });
          await get().refresh();
          return true;
        } catch (err) {
          set({ error: errMsg(err) });
          return false;
        }
      },
      connectVibenet: async () => {
        if (!provider || !get().address) {
          const ok = await get().connect();
          if (!ok) return false;
        }
        if (!provider) return false;
        try {
          await ensureVibenet(provider);
          const chainId = await readChainId(provider);
          set({ chainId, error: undefined });
          await get().refreshVibenet();
          return true;
        } catch (err) {
          set({ error: errMsg(err) });
          return false;
        }
      },
      dripVibenet: async () => {
        let { address } = get();
        if (!address) {
          const ok = await get().connect();
          if (!ok) return null;
          address = get().address;
        }
        if (!address) return null;
        try {
          const res = await fetch(VIBENET_FAUCET_DRIP, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ address }),
          });
          const json = (await res.json()) as {
            tx_hash?: string;
            error?: string;
          };
          if (!res.ok || json.error || !json.tx_hash) {
            throw new Error(json.error || "Faucet refused");
          }
          set({ vibenetDrip: json.tx_hash, error: undefined });
          await get().refreshVibenet();
          return json.tx_hash;
        } catch (err) {
          set({ error: errMsg(err) });
          return null;
        }
      },
      sendOnchain: async (draft) => {
        const { address } = get();
        if (!address || !provider) {
          set({ error: "Connect a wallet first." });
          return null;
        }
        const to = draft.to.trim();
        if (!isEthAddress(to)) {
          set({ error: "Need a live 0x address." });
          return null;
        }
        const amount = draft.amount.trim();
        const n = Number(amount);
        if (!Number.isFinite(n) || n <= 0) {
          set({ error: "Need an amount." });
          return null;
        }
        try {
          await ensureBase(provider);
          const {
            createPublicClient,
            createWalletClient,
            custom,
            http,
            parseEther,
            parseUnits,
          } = await loadViem();
          const publicClient = createPublicClient({
            chain: baseChain,
            transport: http(BASE_RPC),
          });
          const wallet = createWalletClient({
            account: address as `0x${string}`,
            chain: baseChain,
            transport: custom(provider),
          });
          const hash =
            draft.asset === "USDC"
              ? await wallet.writeContract({
                  address: BASE_USDC,
                  abi: ERC20_ABI,
                  functionName: "transfer",
                  args: [to as `0x${string}`, parseUnits(amount, 6)],
                  account: address as `0x${string}`,
                  chain: baseChain,
                })
              : await wallet.sendTransaction({
                  to: to as `0x${string}`,
                  value: parseEther(amount),
                  account: address as `0x${string}`,
                  chain: baseChain,
                });
          await publicClient.waitForTransactionReceipt({ hash });
          const row: ChainSend = {
            tx: hash,
            to: asAddr(to),
            amount,
            asset: draft.asset,
            at: Date.now(),
          };
          set({
            sends: [row, ...get().sends].slice(0, 24),
            chainId: BASE_ID,
            error: undefined,
          });
          await get().refresh();
          return row;
        } catch (err) {
          set({ error: errMsg(err) });
          return null;
        }
      },
      mintTape: async (draft) => {
        const { address, collections } = get();
        if (!address || !provider) {
          set({ error: "Connect a wallet first." });
          return null;
        }
        try {
          await ensureBase(provider);
          const {
            createPublicClient,
            createWalletClient,
            custom,
            decodeEventLog,
            http,
          } = await loadViem();
          const publicClient = createPublicClient({
            chain: baseChain,
            transport: http(BASE_RPC),
          });
          const wallet = createWalletClient({
            account: address as `0x${string}`,
            chain: baseChain,
            transport: custom(provider),
          });
          let collection = collections[address] ?? get().collection;
          if (!collection) {
            const hash = await wallet.deployContract({
              abi: IAM_TAPE_ABI,
              bytecode: IAM_TAPE_BYTECODE,
              args: ["I AM", "IAM"],
              account: address as `0x${string}`,
              chain: baseChain,
            });
            const receipt = await publicClient.waitForTransactionReceipt({
              hash,
            });
            if (!receipt.contractAddress) throw new Error("Deploy failed");
            collection = receipt.contractAddress;
            set({
              collection,
              collections: { ...collections, [address]: collection },
            });
          }
          const uri = metadataUri(draft);
          const hash = await wallet.writeContract({
            address: collection as `0x${string}`,
            abi: IAM_TAPE_ABI,
            functionName: "mint",
            args: [uri],
            account: address as `0x${string}`,
            chain: baseChain,
          });
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          let tokenId = "0";
          for (const log of receipt.logs) {
            try {
              const parsed = decodeEventLog({
                abi: IAM_TAPE_ABI,
                data: log.data,
                topics: log.topics,
              });
              if (parsed.eventName === "Transfer") {
                tokenId = String(parsed.args.tokenId);
              }
            } catch {
              /* other logs */
            }
          }
          const row: ChainMint = {
            tx: hash,
            contract: collection,
            tokenId,
            title: draft.title,
            itemId: draft.itemId,
            at: Date.now(),
          };
          set({ mints: [row, ...get().mints], chainId: BASE_ID });
          await get().refresh();
          return row;
        } catch (err) {
          set({ error: errMsg(err) });
          return null;
        }
      },
    }),
    {
      name: "iam-onchain",
      skipHydration: true,
      partialize: (s) => ({
        collections: s.collections,
        collection: s.collection,
        mints: s.mints,
        sends: s.sends,
      }),
    },
  ),
);

export function hydrateOnchain() {
  const result = useOnchain.persist.rehydrate();
  const done = () => useOnchain.setState({ ready: true });
  if (result && typeof result.then === "function") void result.then(done);
  else done();
  useOnchain.setState({ ready: true });
}

export function seaUrl(row: ChainMint) {
  return openSeaItem(row.contract, row.tokenId);
}
