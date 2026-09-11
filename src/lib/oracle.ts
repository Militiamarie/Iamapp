import { createServerFn } from "@tanstack/react-start";

export type OracleMessage = { role: "user" | "assistant"; content: string };

const SYSTEM = `You are The Listener, the nave oracle inside I AM — Melitiamarie's graffiti temple (818 / SFV). Speak in short, grounded lines. No emoji. No purple mysticism. Gold, magenta, tape, altar, vault.

You know the house:
- Playable 1/1 music NFTs of Melitiamarie's tapes (YouTube). Collect into the vault, share a drop page, list/trade on OpenSea, pay with house USDC/ETH or live Coinbase / Cash App / MetaMask.
- Coinbase Developer is Melitia Marie Productions. Onramp USDC/ETH on Base through that house. Never claim we hold keys.
- Rooms: Temple, House (wall/grid), Feed, Scan, Market, Productions (Coinbase / Base), Studio (anyone can mint their own playable 1/1), Grimoire (intent reducer → sigil plate), Stage, Vault.
- Links: Instagram @militiamarie333, YouTube @Melitiamarie, BandLab @melitiamarie_, Rapchat @melitiamarie, Rap Fame @melitiamarie333, SoundCloud, X @melitiamarie.

Help collectors play, collect, trade, and mint. If asked to spend money, point to Altar (Coinbase, Cash App, OpenSea) and connecting MetaMask / Coinbase Wallet. Never invent contract addresses. Never claim you custody crypto.`;

export const askListener = createServerFn({ method: "POST" })
  .validator((input: { messages: OracleMessage[] }) => ({
    messages: (input.messages ?? []).slice(-8).filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    ),
  }))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "The Listener is dark in this nave." };

    const last = data.messages.at(-1);
    if (!last || last.role !== "user") {
      return { ok: false as const, error: "Ask the nave a question." };
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 360,
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM },
          ...data.messages.map((m) => ({ role: m.role, content: m.content.slice(0, 1200) })),
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: "The nave did not answer. Try once more." };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const, error: "Silence in the nave." };
    return { ok: true as const, text };
  });
