import { shortAddr } from "./format";
import type { HouseProfile } from "./types";

export type ChainKind =
  | "cashapp"
  | "coinbase"
  | "opensea"
  | "eth"
  | "nft"
  | "barcode"
  | "unknown";

export type ScanHit = {
  kind: ChainKind;
  title: string;
  url: string;
  display: string;
  address?: string;
  cashtag?: string;
  contract?: string;
  tokenId?: string;
  chain?: string;
  raw: string;
};

export type HouseRail = {
  kind: Exclude<ChainKind, "unknown" | "barcode" | "nft">;
  label: string;
  url: string;
  qrValue: string;
  display: string;
};

const ETH = /\b(0x[a-fA-F0-9]{40})\b/;
const CASH =
  /(?:cash\.app\/(?:qr\/)?\$?|cashtag:|cashme:|\$)([A-Za-z][A-Za-z0-9_]{1,20})/i;
const OPENSEA_ITEM =
  /opensea\.io\/(?:assets|item)\/([a-z0-9-]+)\/(0x[a-fA-F0-9]{40})\/(\d+)/i;
const NFT_MARKET =
  /magiceden\.io|blur\.io|rarible\.com|zora\.co|foundation\.app|solscan\.io|polygonscan\.com|etherscan\.io|basescan\.org/i;

export function asHttp(raw: string) {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

export function cashPayUrl(cashtag: string, amount?: number) {
  const tag = cashtag.replace(/^\$/, "");
  const base = `https://cash.app/$${tag}`;
  return amount && amount > 0 ? `${base}/${amount.toFixed(2)}` : base;
}

export function openSeaUrl(raw: string) {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (/^opensea\.io/i.test(t)) return `https://${t}`;
  return `https://opensea.io/${t.replace(/^\//, "")}`;
}

export function coinbaseSendUrl(address?: string) {
  if (address) {
    return `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(`ethereum:${address}`)}`;
  }
  return "https://wallet.coinbase.com/";
}

export function coinbaseUrl(raw: string) {
  const t = raw.trim();
  if (!t) return "";
  const eth = t.match(ETH);
  if (eth) return coinbaseSendUrl(eth[1]);
  if (/^https?:\/\//i.test(t)) return t;
  if (/coinbase\.com|go\.cb-w\.com/i.test(t)) return `https://${t.replace(/^https?:\/\//, "")}`;
  return asHttp(t);
}

function looksLikeBarcode(text: string) {
  const t = text.trim();
  if (/^\d{6,14}$/.test(t)) return true;
  if (/^https?:/i.test(t) || t.includes(".")) return false;
  return /^[A-Z0-9\-./+$%]{4,48}$/i.test(t);
}

export function parseScan(input: string): ScanHit {
  const raw = input.trim();
  if (!raw) {
    return { kind: "unknown", title: "Empty", url: "", display: "", raw };
  }

  const cash = raw.match(CASH);
  if (cash && !/opensea|coinbase|0x[a-fA-F0-9]{40}/i.test(raw)) {
    const tag = cash[1];
    return {
      kind: "cashapp",
      title: `Cash App · $${tag}`,
      url: cashPayUrl(tag),
      display: `$${tag}`,
      cashtag: tag,
      raw,
    };
  }

  const item = raw.match(OPENSEA_ITEM);
  if (item) {
    const [, chain, contract, tokenId] = item;
    const url = `https://opensea.io/item/${chain}/${contract}/${tokenId}`;
    return {
      kind: "opensea",
      title: `OpenSea · ${chain} #${tokenId}`,
      url,
      display: `${contract.slice(0, 6)}…${contract.slice(-4)} / ${tokenId}`,
      contract,
      tokenId,
      chain,
      raw,
    };
  }

  if (/opensea\.io/i.test(raw)) {
    try {
      const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      return {
        kind: "opensea",
        title: `OpenSea · ${u.pathname.replace(/^\//, "") || "profile"}`,
        url: u.href,
        display: u.pathname || u.host,
        raw,
      };
    } catch {
      /* fall through */
    }
  }

  if (NFT_MARKET.test(raw)) {
    const url = raw.startsWith("http") ? raw : asHttp(raw);
    return {
      kind: "nft",
      title: "NFT / chain link",
      url,
      display: url.replace(/^https?:\/\//, "").slice(0, 64),
      address: raw.match(ETH)?.[1],
      raw,
    };
  }

  if (/coinbase\.com|go\.cb-w\.com|wallet\.coinbase|cbwallet:|pay\.coinbase/i.test(raw)) {
    const eth = raw.match(ETH);
    const url = raw.startsWith("http")
      ? raw
      : raw.startsWith("cbwallet:")
        ? coinbaseSendUrl(eth?.[1])
        : asHttp(raw);
    return {
      kind: "coinbase",
      title: "Coinbase",
      url,
      display: url.replace(/^https?:\/\//, ""),
      address: eth?.[1],
      raw,
    };
  }

  if (/^ethereum:/i.test(raw)) {
    const address = raw.replace(/^ethereum:/i, "").split(/[?@]/)[0];
    return parseScan(address);
  }

  const eth = raw.match(ETH);
  if (eth) {
    const address = eth[1];
    return {
      kind: "eth",
      title: "ETH address",
      url: `https://basescan.org/address/${address}`,
      display: shortAddr(address),
      address,
      raw,
    };
  }

  if (looksLikeBarcode(raw)) {
    const digits = /^\d{8,14}$/.test(raw);
    return {
      kind: "barcode",
      title: "Barcode",
      url: digits
        ? `https://www.google.com/search?q=${encodeURIComponent(`${raw} barcode`)}`
        : "",
      display: raw,
      raw,
    };
  }

  return {
    kind: "unknown",
    title: "Unrecognized",
    url: raw.startsWith("http") ? raw : "",
    display: raw.slice(0, 64),
    raw,
  };
}

export function houseRails(profile: HouseProfile): HouseRail[] {
  const out: HouseRail[] = [];
  const cash = profile.links.cashapp.trim();
  if (cash) {
    const tag = cash.replace(/^\$/, "");
    const url = cashPayUrl(tag);
    out.push({
      kind: "cashapp",
      label: "Cash App",
      url,
      qrValue: url,
      display: `$${tag}`,
    });
  }
  const cb = profile.links.coinbase.trim();
  if (cb) {
    const eth = cb.match(ETH);
    if (eth) {
      out.push({
        kind: "eth",
        label: "Coinbase",
        url: coinbaseSendUrl(eth[1]),
        qrValue: eth[1],
        display: shortAddr(eth[1]),
      });
    } else {
      const url = coinbaseUrl(cb);
      out.push({
        kind: "coinbase",
        label: "Coinbase",
        url,
        qrValue: url,
        display: url.replace(/^https?:\/\//, ""),
      });
    }
  }
  const os = profile.links.opensea.trim();
  if (os) {
    const url = openSeaUrl(os);
    out.push({
      kind: "opensea",
      label: "OpenSea",
      url,
      qrValue: url,
      display: url.replace(/^https?:\/\//, ""),
    });
  }
  return out;
}

export const RAIL_LABEL: Record<ChainKind, string> = {
  cashapp: "Cash App",
  coinbase: "Coinbase",
  opensea: "OpenSea",
  eth: "Onchain",
  nft: "NFT",
  barcode: "Barcode",
  unknown: "Unknown",
};

export function hitAction(hit: ScanHit) {
  if (hit.kind === "opensea") return "Trade on OpenSea";
  if (hit.kind === "nft") return "Open listing";
  if (hit.kind === "cashapp") return "Pay on Cash App";
  if (hit.kind === "coinbase" || hit.kind === "eth") return "Open Coinbase";
  if (hit.kind === "barcode") return "Look up barcode";
  return "Open rail";
}

export function collectAction(kind: ChainKind) {
  if (kind === "barcode") return "Look up";
  if (kind === "cashapp") return "Pay on Cash App";
  if (kind === "nft") return "Open listing";
  if (kind === "opensea") return "Trade on OpenSea";
  if (kind === "coinbase" || kind === "eth") return "Open Coinbase";
  return "Open rail";
}
