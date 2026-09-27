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
import { locateToken, readToken } from "./any-nft";
import { tokenIdFor } from "./token-id";

export const TAPE_VERSION = 2;
export const META_ORIGIN = "https://iamapp.vercel.app";
export const CONTRACT_META = `${META_ORIGIN}/meta/contract.json`;
/** OpenSea Seaport conduit. Approval lets any marketplace move a listed token. */
export const OPENSEA_CONDUIT =
  "0x1E0049783F008A0085193E00003D00cd54003c71" as const;

export function tokenMetaUrl(tokenId: number | string) {
  return `${META_ORIGIN}/meta/${tokenId}.json`;
}

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

export type Plate = {
  contract: string;
  tokenId: string;
  tx: string;
};

export type ForeignToken = {
  chain: string;
  contract: string;
  tokenId: string;
  title: string;
  image?: string;
  owner?: string;
  url: string;
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
  vibenetEth: number;
  vibenetUsdv: number;
  vibenetDrip?: string;
  collection?: string;
  tapeVersion: number;
  plates: Record<string, Plate>;
  foreign: ForeignToken[];
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
  stampHouse: (items: TapeMeta[]) => Promise<number>;
  bringIn: (raw: string) => Promise<ForeignToken | null>;
};

export type TapeMeta = {
  title: string;
  blurb: string;
  image: string;
  kind: string;
  creator: string;
  youtubeId?: string;
  itemId?: string;
  /** House catalog pieces use the hosted OpenSea metadata. Studio mints do not. */
  hosted?: boolean;
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

const ZERO = "0x0000000000000000000000000000000000000000";

type HouseClient = {
  publicClient: {
    waitForTransactionReceipt: (args: { hash: `0x${string}` }) => Promise<unknown>;
    readContract: (args: {
      address: `0x${string}`;
      abi: typeof IAM_TAPE_ABI;
      functionName: "ownerOf" | "isApprovedForAll";
      args: readonly unknown[];
    }) => Promise<unknown>;
  };
  wallet: {
    deployContract: (args: {
      abi: typeof IAM_TAPE_ABI;
      bytecode: typeof IAM_TAPE_BYTECODE;
      args: [string, string, string];
      account: `0x${string}`;
      chain: typeof baseChain;
    }) => Promise<`0x${string}`>;
    writeContract: (args: {
      address: `0x${string}`;
      abi: typeof IAM_TAPE_ABI;
      functionName: "mint" | "mintMany" | "setApprovalForAll";
      args: readonly unknown[];
      account: `0x${string}`;
      chain: typeof baseChain;
    }) => Promise<`0x${string}`>;
  };
};

async function houseClient(address: string): Promise<HouseClient> {
  if (!provider) throw new Error("Connect a wallet first.");
  const { createPublicClient, createWalletClient, custom, http } = await loadViem();
  return {
    publicClient: createPublicClient({
      chain: baseChain,
      transport: http(BASE_RPC),
    }) as HouseClient["publicClient"],
    wallet: createWalletClient({
      account: address as `0x${string}`,
      chain: baseChain,
      transport: custom(provider),
    }) as HouseClient["wallet"],
  };
}

function houseKey(address: string) {
  return `${address.toLowerCase()}:v${TAPE_VERSION}`;
}

async function ensureCollection(
  get: () => OnchainState,
  set: (partial: Partial<OnchainState>) => void,
  client: HouseClient,
  address: string,
) {
  const current = get();
  const saved = current.collections[houseKey(address)];
  if (current.tapeVersion === TAPE_VERSION && (saved || current.collection)) {
    return (saved || current.collection) as string;
  }
  const hash = await client.wallet.deployContract({
    abi: IAM_TAPE_ABI,
    bytecode: IAM_TAPE_BYTECODE,
    args: ["I AM", "IAM", CONTRACT_META],
    account: address as `0x${string}`,
    chain: baseChain,
  });
  const receipt = (await client.publicClient.waitForTransactionReceipt({
    hash,
  })) as { contractAddress?: `0x${string}` | null };
  if (!receipt.contractAddress) throw new Error("Deploy failed");
  const collection = receipt.contractAddress;
  set({
    collection,
    tapeVersion: TAPE_VERSION,
    collections: { ...get().collections, [houseKey(address)]: collection },
  });
  return collection;
}

function rememberPlate(
  set: (partial: Partial<OnchainState>) => void,
  get: () => OnchainState,
  itemId: string,
  contract: string,
  tokenId: string,
  tx: string,
) {
  const row: ChainMint = {
    tx,
    contract,
    tokenId,
    title: itemId,
    itemId,
    at: Date.now(),
  };
  set({
    plates: {
      ...get().plates,
      [itemId]: { contract, tokenId, tx },
    },
    mints: [row, ...get().mints.filter((m) => m.itemId !== itemId)].slice(0, 80),
  });
}

async function approveConduit(
  client: HouseClient,
  collection: string,
  address: string,
) {
  const approved = await client.publicClient.readContract({
    address: collection as `0x${string}`,
    abi: IAM_TAPE_ABI,
    functionName: "isApprovedForAll",
    args: [address as `0x${string}`, OPENSEA_CONDUIT],
  });
  if (approved === true) return;
  const hash = await client.wallet.writeContract({
    address: collection as `0x${string}`,
    abi: IAM_TAPE_ABI,
    functionName: "setApprovalForAll",
    args: [OPENSEA_CONDUIT, true],
    account: address as `0x${string}`,
    chain: baseChain,
  });
  await client.publicClient.waitForTransactionReceipt({ hash });
}

async function stampOne(
  get: () => OnchainState,
  set: (partial: Partial<OnchainState>) => void,
  draft: TapeMeta,
): Promise<ChainMint | null> {
  const { address } = get();
  if (!address || !provider) {
    set({ error: "Connect a wallet first." });
    return null;
  }
  try {
    await ensureBase(provider);
    const client = await houseClient(address);
    const collection = await ensureCollection(get, set, client, address);
    const tokenId = tokenIdFor(draft.itemId || draft.title);
    const uri = draft.hosted ? tokenMetaUrl(tokenId) : metadataUri(draft);
    const holder = await client.publicClient.readContract({
      address: collection as `0x${string}`,
      abi: IAM_TAPE_ABI,
      functionName: "ownerOf",
      args: [BigInt(tokenId)],
    });
    let tx = "already";
    if (String(holder).toLowerCase() === ZERO) {
      tx = await client.wallet.writeContract({
        address: collection as `0x${string}`,
        abi: IAM_TAPE_ABI,
        functionName: "mint",
        args: [address as `0x${string}`, BigInt(tokenId), uri],
        account: address as `0x${string}`,
        chain: baseChain,
      });
      await client.publicClient.waitForTransactionReceipt({
        hash: tx as `0x${string}`,
      });
    }
    await approveConduit(client, collection, address);
    if (draft.itemId) {
      rememberPlate(set, get, draft.itemId, collection, String(tokenId), tx);
    }
    const row: ChainMint = {
      tx,
      contract: collection,
      tokenId: String(tokenId),
      title: draft.title,
      itemId: draft.itemId,
      at: Date.now(),
    };
    set({ chainId: BASE_ID, error: undefined });
    await get().refresh();
    return row;
  } catch (err) {
    set({ error: errMsg(err) });
    return null;
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
      plates: {},
      foreign: [],
      tapeVersion: 0,
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
        const row = await stampOne(get, set, draft);
        return row;
      },
      stampHouse: async (items) => {
        const { address } = get();
        if (!address || !provider) {
          set({ error: "Connect a wallet first." });
          return 0;
        }
        try {
          await ensureBase(provider);
          const client = await houseClient(address);
          const collection = await ensureCollection(get, set, client, address);
          const pending = items.filter((item) => {
            const id = String(tokenIdFor(item.itemId || item.title));
            const plate = get().plates[item.itemId || ""];
            return item.itemId && plate?.tokenId !== id;
          });
          let stamped = 0;
          for (let i = 0; i < pending.length; i += 12) {
            const chunk = pending.slice(i, i + 12);
            const ids = chunk.map((item) =>
              BigInt(tokenIdFor(item.itemId || item.title)),
            );
            const uris = chunk.map((item) => tokenMetaUrl(tokenIdFor(item.itemId || item.title)));
            const freeIds: bigint[] = [];
            const freeUris: string[] = [];
            const freeItems: TapeMeta[] = [];
            for (let n = 0; n < ids.length; n++) {
              const holder = await client.publicClient.readContract({
                address: collection as `0x${string}`,
                abi: IAM_TAPE_ABI,
                functionName: "ownerOf",
                args: [ids[n]],
              });
              if (holder === "0x0000000000000000000000000000000000000000") {
                freeIds.push(ids[n]);
                freeUris.push(uris[n]);
                freeItems.push(chunk[n]);
              } else if (chunk[n].itemId) {
                rememberPlate(set, get, chunk[n].itemId!, collection, ids[n].toString(), "already");
              }
            }
            if (!freeIds.length) continue;
            const hash = await client.wallet.writeContract({
              address: collection as `0x${string}`,
              abi: IAM_TAPE_ABI,
              functionName: "mintMany",
              args: [address as `0x${string}`, freeIds, freeUris],
              account: address as `0x${string}`,
              chain: baseChain,
            });
            await client.publicClient.waitForTransactionReceipt({ hash });
            for (const item of freeItems) {
              if (!item.itemId) continue;
              rememberPlate(
                set,
                get,
                item.itemId,
                collection,
                String(tokenIdFor(item.itemId)),
                hash,
              );
              stamped += 1;
            }
          }
          await approveConduit(client, collection, address);
          set({ chainId: BASE_ID, error: undefined });
          await get().refresh();
          return stamped;
        } catch (err) {
          set({ error: errMsg(err) });
          return 0;
        }
      },
      bringIn: async (raw) => {
        const loc = locateToken(raw);
        if (!loc) {
          set({ error: "Need an OpenSea item link, or a contract and token number." });
          return null;
        }
        const key = `${loc.chain}:${loc.contract.toLowerCase()}:${loc.tokenId}`;
        const read = await readToken(loc);
        const row: ForeignToken = {
          chain: loc.chain,
          contract: loc.contract,
          tokenId: loc.tokenId,
          title: read.title,
          image: read.image,
          owner: read.owner,
          url: loc.url,
          at: Date.now(),
        };
        set({
          foreign: [row, ...get().foreign.filter(
            (f) =>
              `${f.chain}:${f.contract.toLowerCase()}:${f.tokenId}` !== key,
          )].slice(0, 40),
          error: undefined,
        });
        return row;
      },
    }),
    {
      name: "iam-onchain",
      skipHydration: true,
      partialize: (s) => ({
        collections: s.collections,
        collection: s.collection,
        tapeVersion: s.tapeVersion,
        plates: s.plates,
        foreign: s.foreign,
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
