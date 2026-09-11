import { getRequest } from "@tanstack/react-start/server";
import { HOUSE } from "./site";
import type { OnrampAsset } from "./onramp";

export type CdpSessionInput = {
  asset?: OnrampAsset;
  amountUsd?: number;
  address?: string;
};

export type CdpSessionResult =
  | { ok: true; url: string; live: true }
  | { ok: false; reason: "unconfigured" | "no-address" | "rejected" };

export function cdpConfigured() {
  return Boolean(cdpKeyId() && cdpKeySecret());
}

function cdpKeyId() {
  return (
    process.env.CDP_API_KEY_ID ||
    process.env.CDP_API_KEY_NAME ||
    process.env.KEY_NAME ||
    ""
  ).trim();
}

function cdpKeySecret() {
  return (
    process.env.CDP_API_KEY_SECRET ||
    process.env.KEY_SECRET ||
    ""
  )
    .trim()
    .replace(/\\n/g, "\n");
}

function requestOrigin() {
  try {
    const req = getRequest();
    if (!req) return "https://militiamarie.github.io";
    const host =
      req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    if (!host) return "https://militiamarie.github.io";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  } catch {
    return "https://militiamarie.github.io";
  }
}

function clientIp() {
  try {
    const req = getRequest();
    if (!req) return "127.0.0.1";
    const xf = req.headers.get("x-forwarded-for") || "";
    const ip = xf.split(",")[0]?.trim();
    if (ip) return ip;
    return req.headers.get("x-real-ip")?.trim() || "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

export async function issueOnrampSession(
  input: CdpSessionInput,
): Promise<CdpSessionResult> {
  const address = input.address?.trim();
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { ok: false, reason: "no-address" };
  }
  const apiKeyId = cdpKeyId();
  const apiKeySecret = cdpKeySecret();
  if (!apiKeyId || !apiKeySecret) {
    return { ok: false, reason: "unconfigured" };
  }

  const requestMethod = "POST";
  const requestHost = "api.developer.coinbase.com";
  const requestPath = "/onramp/v1/token";
  const { generateJwt } = await import("@coinbase/cdp-sdk/auth");
  const jwt = await generateJwt({
    apiKeyId,
    apiKeySecret,
    requestMethod,
    requestHost,
    requestPath,
    expiresIn: 120,
  });

  const asset = input.asset === "ETH" ? "ETH" : "USDC";
  const res = await fetch(`https://${requestHost}${requestPath}`, {
    method: requestMethod,
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      addresses: [
        {
          address,
          blockchains: ["base", "ethereum"],
        },
      ],
      assets: [asset],
      clientIp: clientIp(),
    }),
  });

  if (!res.ok) return { ok: false, reason: "rejected" };
  const body = (await res.json()) as { token?: string };
  if (!body.token) return { ok: false, reason: "rejected" };

  const origin = requestOrigin();
  const params = new URLSearchParams();
  params.set("sessionToken", body.token);
  params.set("defaultAsset", asset);
  params.set("defaultNetwork", "base");
  params.set("fiatCurrency", "USD");
  params.set("partnerUserRef", HOUSE.partnerRef);
  params.set("redirectUrl", `${origin}/altar`);
  if (input.amountUsd && input.amountUsd > 0) {
    params.set(
      "presetFiatAmount",
      String(Math.max(1, Math.round(input.amountUsd))),
    );
  }
  return {
    ok: true,
    live: true,
    url: `https://pay.coinbase.com/buy/select-asset?${params.toString()}`,
  };
}