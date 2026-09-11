import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BASE_ADD_CHAIN,
  BASE_HEX,
  BASE_ID,
  BASE_RPC,
  BASE_USDC,
  discoverWallet,
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

type OnchainState = {
  ready: boolean;
  status: "idle" | "connecting" | "ready" | "error";
  address?: string;
  chainId?: number;
  walletName?: string;
  eth: number;
  usdc: number;
  collection?: string;
  collections: Record<string, string>;
  mints: ChainMint[];
  error?: string;
  connect: (given?: { provider: Eip1193; name: string }) => Promise<boolean>;
  disconnect: () => void;
  refresh: () => Promise<void>;
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

const USDC_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
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

async function ensureBase(eip: Eip1193) {
  const id = await eip.request({ method: "eth_chainId" });
  if (String(id).toLowerCase() === BASE_HEX) return;
  try {
    await eip.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_HEX }],
    });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 4902) {
      await eip.request({
        method: "wallet_addEthereumChain",
        params: [BASE_ADD_CHAIN],
      });
      return;
    }
    throw err;
  }
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
      appChainIds: [BASE_ID],
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

function errMsg(err: unknown) {
  const e = err as { shortMessage?: string; message?: string };
  return e.shortMessage || e.message || "Wallet rejected";
}

export const useOnchain = create<OnchainState>()(
  persist(
    (set, get) => ({
      ready: false,
      status: "idle",
      eth: 0,
      usdc: 0,
      collections: {},
      mints: [],
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
      disconnect: () => {
        provider = null;
        set({
          status: "idle",
          address: undefined,
          chainId: undefined,
          walletName: undefined,
          eth: 0,
          usdc: 0,
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
          const [wei, rawUsdc] = await Promise.all([
            publicClient.getBalance({ address: address as `0x${string}` }),
            publicClient.readContract({
              address: BASE_USDC,
              abi: USDC_ABI,
              functionName: "balanceOf",
              args: [address as `0x${string}`],
            }),
          ]);
          set({
            eth: Number(formatEther(wei)),
            usdc: Number(formatUnits(rawUsdc, 6)),
            chainId: BASE_ID,
          });
        } catch {
          /* public rpc blip — keep last */
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
          set({ mints: [row, ...get().mints] });
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
