import type { Rail } from "./types";

export const ETH_RATE = 2500;

export function usdcToEth(usdc: number) {
  return Math.round((usdc / ETH_RATE) * 1e6) / 1e6;
}

export function roundUsdc(n: number) {
  return Math.round(n * 100) / 100;
}

export function roundEth(n: number) {
  return Math.round(n * 1e6) / 1e6;
}

export function formatUsdc(n: number) {
  return `${n.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })} USDC`;
}

export function formatEth(n: number) {
  return `Ξ${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })}`;
}

export function formatRail(rail: Rail, usdc: number) {
  return rail === "USDC" ? formatUsdc(usdc) : formatEth(usdcToEth(usdc));
}

export function shortAddr(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function kindLabel(kind: string) {
  switch (kind) {
    case "music":
      return "Music";
    case "beat":
      return "Beat";
    case "spell":
      return "Spell";
    case "sigil":
      return "Sigil";
    case "deity":
      return "Deity";
    case "quote":
      return "Quote";
    default:
      return kind;
  }
}

export function formatAgo(at: number) {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  const d = Math.floor(s / 86400);
  if (d < 14) return `${d}d`;
  return new Date(at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
