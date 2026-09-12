import { HOUSE } from "./site";

export const LINKSCAN_ORIGIN = HOUSE.linkscan;

export type LinkscanDoorOpts = {
  cashtag?: string;
  amount?: number;
  returnTo?: string;
};

export function linkscanDoor(opts: LinkscanDoorOpts = {}) {
  const url = new URL(LINKSCAN_ORIGIN);
  const tag = (opts.cashtag ?? "").trim().replace(/^\$/, "");
  if (tag) url.searchParams.set("cashtag", tag);
  if (opts.amount && opts.amount > 0) {
    url.searchParams.set("amount", String(Math.round(opts.amount)));
  }
  if (opts.returnTo) url.searchParams.set("return", opts.returnTo);
  return url.toString();
}

export function iamScanReturn(origin: string, raw: string) {
  const url = new URL("/scan", origin.endsWith("/") ? origin : `${origin}/`);
  url.searchParams.set("from", "linkscan");
  url.searchParams.set("q", raw);
  return url.toString();
}

export function ingestLinkscanSearch(search: {
  q?: string;
  scan?: string;
  from?: string;
}) {
  const raw = (search.q ?? search.scan ?? "").trim();
  if (!raw) return null;
  return {
    raw,
    fromLinkscan: (search.from ?? "").toLowerCase() === "linkscan",
  };
}
