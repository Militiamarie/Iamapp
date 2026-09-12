# I AM

Melitiamarie’s temple. Play the tape. Scan a rail. Collect the 1/1. Stamp it on Base.

Live source: [github.com/Militiamarie/Iamapp](https://github.com/Militiamarie/Iamapp)

## On the web

**Live temple:** [melitiamarie.netlify.app](https://melitiamarie.netlify.app) · [militiamarie.github.io](https://militiamarie.github.io)

Anyone with the link can open the house in a browser, play the catalog, and install I AM on their phone.

**Productions** is the nave: Melitia Marie Productions on Coinbase Developer, Wallet on Base, send ETH / USDC, Vibenet test pool, on-ramp, stamp a 1/1, live OpenSea (`opensea.io/melitiamarie`), scan Cash App / Coinbase / OpenSea at the door.

**LinkScan** ([live](https://militiamarie.github.io/linkscan/) · [hub](https://github.com/Militiamarie/linkscan)) is the sister scanner. Open it from Scan. A hit there returns to `/scan?from=linkscan&q=…` and lands in the booth. QR plus UPC / EAN / Code 128. Cash App and NFT URLs.

**Mass pay** (`/payouts`) builds the Unchained Bitcoin CSV (vault → withdraw → multiple addresses → you sign) and Base USDC / ETH splits from Coinbase Wallet. Hub copy: [`payouts/`](payouts/). This house never holds keys.

Demo vault is for the temple. Live rails are Coinbase, Cash App, OpenSea, Base, and Unchained (CSV you sign).

## Install as an app

- **iPhone / iPad** — Safari → Share → Add to Home Screen
- **Android** — Chrome → Install app
- In the house: **Get app**

That is a real app icon, fullscreen, with the same temple. Native **App Store** and **Google Play** listings need Melitiamarie’s Apple Developer and Google Play Console accounts. Listing copy, privacy, terms, and support URLs are in [`store/LISTING.md`](store/LISTING.md).

## Publish

Import on [Vercel](https://vercel.com/new). Framework: Vite / Other. Build `npm run build`. Nitro writes the Vercel output.

```bash
npm install
npm run dev
npm run build
```

Requires Node 22.

## What’s inside

| Room | What it does |
| --- | --- |
| Temple | Featured plates and the door into the house |
| House | Profile, wall, grid, stills |
| Feed | House posts |
| Scan | Camera QR / barcode for Cash App, Coinbase, OpenSea, NFT markets — LinkScan handshake |
| Market | Collect music, beats, spells, sigils, deity work, quotes |
| Productions | Melitia Marie Productions on Coinbase Developer, send on Base, Vibenet pool, OpenSea, scanner |
| Mass pay | Roster, Unchained BTC CSV, Base USDC / ETH batch, hub JSON |
| Studio | Press a 1/1 — drop audio or record in the booth |
| Grimoire | Reduce an intent into a gold-and-magenta plate |
| Stage | Rites, 528Hz nave, shoutouts |
| Vault | What you collected on this device |

Demo USDC / ETH in the vault is house credit, not real money. Coinbase, Cash App, and OpenSea are the live rails — nothing is custodied here. Unchained mass pay is a CSV you upload and sign in your own vault.

## Legal

- [Privacy](/privacy)
- [Terms](/terms)
- [Support](/support)

## Stack

TanStack Start · React 19 · Tailwind v4 · Zustand · viem (Base) · Coinbase CDP SDK. Node 22.
