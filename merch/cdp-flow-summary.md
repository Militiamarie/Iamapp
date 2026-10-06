# CDP Flow Summary — Mad Souls Family / I Am

All rails now use **USD**, not USDC. Bills are paid in dollars, so there is no crypto conversion step.

## The three-step rail

1. **Create the transfer.** Server calls `POST /api/cdp/create-transfer` with the CDP account as source, your Base address as target, the amount in USD, and `execute: false`. Returns a `transferId` and fees. Nothing moves. Quote lasts ~10-15 minutes.

2. **Show the buyer the quote.** They see the amount plus fees and confirm. If they walk, the quote dies.

3. **Execute.** Server calls `POST /api/cdp/execute-transfer` with the `transferId`. Status goes quoted -> processing -> completed or failed. Poll until it lands. Completed means the USD is on Base and spendable.

## Tonight's bills (all USD)

- BWP: $700
- Verizon: $449
- Pep Boys: $1,700
- **Total: $2,849**

George's Silverado (recurring monthly): $1,530 ($1,100 payment + $430 insurance)

## The Coinbase card path

1. Transfer USD from CDP to your Coinbase fiat balance (instant).
2. Check the card's daily spending limit covers $2,849.
3. Tap the Coinbase card at burbankwaterandpower.com, verizon.com, and pepboys.com.
4. No ACH wait — the card spends directly from the fiat balance.

## The ACH fallback

If you want dollars in a bank account instead: withdraw USD from Coinbase fiat to your linked bank. ACH takes 1-3 business days. The clock starts when the USD hits the bank, not when it leaves Base.

## What stays off the phone

- CDP API key and wallet secret live on a server you control.
- Create and execute are server routes. The storefront only sends the order id.
- Tie `metadata.orderId` to the Shopify order so a completed transfer cannot be claimed twice.

## Sandbox first

Do not point at a live Base wallet until a $1 quote completes.
