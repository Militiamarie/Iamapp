# Coinbase CDP Transfer Flow — Mad Souls Family Merch

The page you sent (execute-transfer) is only step 3. Here is the whole rail.

## The three steps

**1. Create (quote only).** Server calls `POST /platform/v2/transfers` with `execute: false`. Source is the buyer's account, target is your Base address, asset is USDC, amount matches the piece ($75 Origin tank, $65 MMIW tank, $185 Trail of Tears Jacket). Response gives a `transferId` and a fees array. Quote lasts about 10–15 minutes. Nothing has moved.

**2. Show the buyer.** Amount plus fees. They confirm or walk away. If they walk, you never execute and the quote dies.

**3. Execute.** Server calls `POST /platform/v2/transfers/{transferId}/execute` — the endpoint from the docs page. Status goes quoted → processing → completed or failed. Poll until it lands. Completed: mark the Shopify order paid, fulfill through Printful or your cousins. Failed: read `failureReason`, create a new transfer — never retry the same id.

## Shortcut

Create with `execute: true` quotes and sends in one call. Use only after the buyer has already confirmed.

## What stays off the phone

- CDP API key and wallet secret live on a server you control.
- Create and execute are server routes. The storefront only sends the order id and gets back quoted or paid.
- Tie `metadata.orderId` to the Shopify order so a completed transfer cannot be claimed twice.
- Sandbox first. Coinbase has test addresses and test emails. Do not point at a live Base wallet until a $1 quote completes.

## Files in this repo

- `server/cdp-transfer.js` — the route handlers (create, execute, poll).
- `server/cdp-routes.js` — Express mount wiring.
- Env vars: `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `CDP_WALLET_SECRET`, `BASE_ADDRESS`.

## For the drop today

Card checkout on Shopify still ships the jacket. This rail is the USDC path next to it.