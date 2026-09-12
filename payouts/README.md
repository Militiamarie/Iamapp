# I AM · mass pay

Melitia Marie Productions.

This folder is the **hub** copy of the payroll files. Signing still happens in
your wallet / Unchained vault. The house never holds keys.

## Rails

| File | Rail | What you do |
| --- | --- | --- |
| `UNCHAINED.csv` | Unchained vault (Bitcoin) | Vault → Withdraw → Multiple addresses → upload → review → sign → broadcast |
| `BASE-USDC.csv` | Base USDC | Connect Coinbase Wallet in I AM → Mass pay → Send USDC |
| `roster.json` | Hub record | House copy of names, amounts, memos. Not a signed payment. |

Unchained batch spend: up to 500 destinations in one Bitcoin transaction.

Help: https://www.unchained.com/blog/batch-spending-for-vaults

App: https://app.unchained.com/

## Unchained CSV format

```
address,amount
bc1qexampleaddressxxxxxxxxxxxxxxxxxxxxxxxx,0.002
```

- `address` — Bitcoin (bc1 / 1 / 3)
- `amount` — BTC, not sats
- No empty rows
- You must sign. Nobody else can move vault funds.

## Status

- **Hub (GitHub):** this repo, `payouts/`
- **Unchained:** CSV is the upload. Not signed from here.
- **I AM Mass pay desk:** `/payouts` in the app

Build the roster in the app, download the CSV, then finish in Unchained.
