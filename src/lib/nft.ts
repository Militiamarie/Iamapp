import { openSeaItem } from "./chain";
import { openSeaCreate, openSeaSearch } from "./onramp";
import { useOnchain } from "./onchain";
import { liveOrigin } from "./site";
import { tokenIdFor } from "./token-id";
import type { CatalogItem } from "./types";

export { tokenIdFor };

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
  item: Pick<CatalogItem, "id" | "title" | "creator" | "onchain">,
) {
  if (item.onchain) {
    return openSeaItem(item.onchain.contract, item.onchain.tokenId);
  }
  const plate = useOnchain.getState().plates[item.id];
  if (plate) return openSeaItem(plate.contract, plate.tokenId);
  const { collection, tapeVersion } = useOnchain.getState();
  if (collection && tapeVersion === 2) {
    return openSeaItem(collection, String(tokenIdFor(item.id)));
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
