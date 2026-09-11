import { openSeaItem } from "./chain";
import { openSeaCreate, openSeaSearch } from "./onramp";
import { liveOrigin } from "./site";
import type { CatalogItem } from "./types";

function hashId(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function tokenIdFor(id: string) {
  return (hashId(id) % 9000) + 1000;
}

export function dropPath(id: string) {
  return `/drop/${encodeURIComponent(id)}`;
}

export function dropUrl(id: string) {
  const origin = liveOrigin();
  return origin ? `${origin}${dropPath(id)}` : dropPath(id);
}

export function openSeaListUrl() {
  return openSeaCreate();
}

export function openSeaFindUrl(title: string, creator?: string) {
  return openSeaSearch([creator, title].filter(Boolean).join(" "));
}

export function tradeUrl(
  item: Pick<CatalogItem, "title" | "creator" | "onchain">,
) {
  if (item.onchain) {
    return openSeaItem(item.onchain.contract, item.onchain.tokenId);
  }
  return openSeaFindUrl(item.title, item.creator);
}

export function nftMeta(item: Pick<CatalogItem, "id" | "title" | "creator" | "edition">) {
  return {
    collection: "I AM",
    chain: "Base",
    standard: "ERC-721",
    tokenId: tokenIdFor(item.id),
    edition: item.edition,
    royalty: "10% to the house on OpenSea",
  };
}

export async function shareDrop(item: Pick<CatalogItem, "id" | "title" | "blurb">) {
  const url = dropUrl(item.id);
  const text = `${item.title} — I AM 1/1. Play it. Collect it. Trade it.`;
  try {
    if (navigator.share) {
      await navigator.share({ title: item.title, text, url });
      return "shared";
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch {
    return "cancelled";
  }
}
