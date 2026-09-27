import { BASE_RPC, openSeaItem } from "./chain";

export type TokenLoc = {
  chain: string;
  contract: string;
  tokenId: string;
  url: string;
};

const READ: Record<string, { rpc: string; slug: string }> = {
  ethereum: { rpc: "https://cloudflare-eth.com", slug: "ethereum" },
  eth: { rpc: "https://cloudflare-eth.com", slug: "ethereum" },
  base: { rpc: BASE_RPC, slug: "base" },
  optimism: { rpc: "https://mainnet.optimism.io", slug: "optimism" },
  arbitrum: { rpc: "https://arb1.arbitrum.io/rpc", slug: "arbitrum" },
  matic: { rpc: "https://polygon-rpc.com", slug: "matic" },
  polygon: { rpc: "https://polygon-rpc.com", slug: "matic" },
  zora: { rpc: "https://rpc.zora.energy", slug: "zora" },
  blast: { rpc: "https://rpc.blast.io", slug: "blast" },
  avalanche: { rpc: "https://api.avax.network/ext/bc/C/rpc", slug: "avalanche" },
  bsc: { rpc: "https://bsc-dataseed.binance.org", slug: "bsc" },
  ape_chain: { rpc: "https://rpc.apechain.com/http", slug: "ape_chain" },
};

const EXPLORER_CHAIN: Record<string, string> = {
  "basescan.org": "base",
  "etherscan.io": "ethereum",
  "polygonscan.com": "matic",
  "optimistic.etherscan.io": "optimism",
  "arbiscan.io": "arbitrum",
};

export function locateToken(raw: string): TokenLoc | null {
  const text = raw.trim();
  if (!text) return null;

  const sea = text.match(
    /opensea\.io\/(?:assets|item)\/([a-z0-9_-]+)\/(0x[a-fA-F0-9]{40})\/(\d+)/i,
  );
  if (sea) {
    const chain = sea[1].toLowerCase();
    return packed(chain, sea[2], sea[3]);
  }

  const blur = text.match(
    /blur\.io\/(?:eth\/)?asset\/(0x[a-fA-F0-9]{40})\/(\d+)/i,
  );
  if (blur) return packed("ethereum", blur[1], blur[2]);

  try {
    const u = new URL(text.startsWith("http") ? text : `https://${text}`);
    const host = u.hostname.replace(/^www\./, "");
    const chain = EXPLORER_CHAIN[host];
    if (chain) {
      const path = u.pathname.match(
        /\/(?:nft|token)\/(0x[a-fA-F0-9]{40})(?:\/(\d+))?/i,
      );
      const id = path?.[2] || u.searchParams.get("a") || "";
      if (path && /^\d+$/.test(id)) return packed(chain, path[1], id);
    }
  } catch {
    /* not a url */
  }

  const bare = text.match(/^(0x[a-fA-F0-9]{40})[/:](\d+)$/);
  if (bare) return packed("base", bare[1], bare[2]);
  return null;
}

function packed(chain: string, contract: string, tokenId: string): TokenLoc {
  const slug = READ[chain]?.slug || chain;
  return {
    chain: slug,
    contract,
    tokenId,
    url: openSeaItem(contract, tokenId).replace("/item/base/", `/item/${slug}/`),
  };
}

const ERC721_READ = [
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const;

export type ReadToken = {
  title: string;
  image?: string;
  owner?: string;
};

export async function readToken(loc: TokenLoc): Promise<ReadToken> {
  const row = READ[loc.chain] ?? READ.base;
  const fallback: ReadToken = {
    title: `${loc.chain} #${loc.tokenId}`,
  };
  try {
    const { createPublicClient, http } = await import("viem");
    const client = createPublicClient({ transport: http(row.rpc) });
    const address = loc.contract as `0x${string}`;
    const id = BigInt(loc.tokenId);
    const [uri, owner, collection] = await Promise.all([
      client.readContract({ address, abi: ERC721_READ, functionName: "tokenURI", args: [id] }).catch(() => ""),
      client.readContract({ address, abi: ERC721_READ, functionName: "ownerOf", args: [id] }).catch(() => ""),
      client.readContract({ address, abi: ERC721_READ, functionName: "name" }).catch(() => ""),
    ]);
    const meta = await metaFrom(String(uri || ""));
    return {
      title: meta.name || (collection ? `${collection} #${loc.tokenId}` : fallback.title),
      image: meta.image,
      owner: owner ? String(owner) : undefined,
    };
  } catch {
    return fallback;
  }
}

async function metaFrom(uri: string): Promise<{ name?: string; image?: string }> {
  if (!uri) return {};
  try {
    let text = "";
    if (uri.startsWith("data:application/json")) {
      const comma = uri.indexOf(",");
      const body = uri.slice(comma + 1);
      text = uri.includes(";base64") ? atob(body) : decodeURIComponent(body);
    } else {
      const url = uri.startsWith("ipfs://")
        ? `https://ipfs.io/ipfs/${uri.slice(7)}`
        : uri;
      if (!/^https?:/i.test(url)) return {};
      const res = await fetch(url);
      if (!res.ok) return {};
      text = await res.text();
    }
    const json = JSON.parse(text) as { name?: string; image?: string };
    let image = json.image || "";
    if (image.startsWith("ipfs://")) image = `https://ipfs.io/ipfs/${image.slice(7)}`;
    return { name: json.name, image: image || undefined };
  } catch {
    return {};
  }
}
