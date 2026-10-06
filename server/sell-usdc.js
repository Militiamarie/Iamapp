/**
 * Sell USDC on Base -> USD -> linked bank account (Coinbase platform).
 * This is the leg that turns crypto into spendable dollars for the bills.
 *
 * Install: npm i @coinbase/cdp-sdk
 *
 * Env vars (never commit):
 *   CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET
 *   BASE_ADDRESS          - your Base wallet holding the USDC
 *   COINBASE_BANK_ACCOUNT - your linked bank account id (from Coinbase)
 *
 * Timing:
 *   - USDC -> USD conversion on Coinbase: instant (same-day).
 *   - USD -> bank account: 1-3 business days (ACH).
 *   - So the 3-day clock starts when the USD hits your bank, NOT when
 *     the USDC leaves Base. Pep Boys gets paid when the ACH clears.
 *
 * SANDBOX FIRST. Do not point at a live wallet until a $1 test completes.
 */

const express = require('express')
const router = express.Router()

const CDP_API_KEY_ID = process.env.CDP_API_KEY_ID
const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET
const CDP_WALLET_SECRET = process.env.CDP_WALLET_SECRET
const BASE_ADDRESS = process.env.BASE_ADDRESS
const COINBASE_BANK_ACCOUNT = process.env.COINBASE_BANK_ACCOUNT

// ---------- SDK setup ----------
// npm i @coinbase/cdp-sdk
// const { CdpClient } = require('@coinbase/cdp-sdk')
// const cdp = new CdpClient({ apiKeyId, apiKeySecret, walletSecret })

// ---------- 1. SELL USDC -> USD (instant) ----------
/**
 * POST /api/cdp/sell-usdc
 * Body: { amountUsdc }
 *
 * Sells USDC on Base for USD inside Coinbase. Conversion is instant.
 * The USD lands in your Coinbase fiat balance immediately.
 */
router.post('/sell-usdc', async (req, res) => {
  try {
    const { amountUsdc } = req.body
    if (!amountUsdc) {
      return res.status(400).json({ error: 'amountUsdc required' })
    }
    if (!BASE_ADDRESS) {
      return res.status(500).json({ error: 'BASE_ADDRESS not configured' })
    }

    // REAL SDK CALL (uncomment when SDK is installed):
    // const order = await cdp.trades.create({ from: { asset: 'usdc', network: 'base', address: BASE_ADDRESS }, to: { asset: 'usd' }, amount: String(amountUsdc) })

    // PSEUDOCODE RESPONSE:
    const order = {
      id: 'trade_PLACEHOLDER',
      status: 'completed',
      from: { asset: 'usdc', amount: String(amountUsdc) },
      to: { asset: 'usd', amount: String(amountUsdc) },
      completedAt: new Date().toISOString()
    }

    res.json({ orderId: order.id, status: order.status, usdcSold: order.from.amount, usdReceived: order.to.amount, completedAt: order.completedAt })
  } catch (err) {
    console.error('sell-usdc error:', err.details || err.message)
    res.status(err.status || 500).json({ error: err.message, details: err.details })
  }
})

// ---------- 2. WITHDRAW USD -> BANK (1-3 business days) ----------
/**
 * POST /api/cdp/withdraw-usd
 * Body: { amountUsd }
 *
 * Withdraws USD from your Coinbase fiat balance to your linked bank.
 * ACH takes 1-3 business days. The 3-day clock starts HERE.
 */
router.post('/withdraw-usd', async (req, res) => {
  try {
    const { amountUsd } = req.body
    if (!amountUsd) {
      return res.status(400).json({ error: 'amountUsd required' })
    }
    if (!COINBASE_BANK_ACCOUNT) {
      return res.status(500).json({ error: 'COINBASE_BANK_ACCOUNT not configured' })
    }

    // REAL SDK CALL (uncomment when SDK is installed):
    // const withdrawal = await cdp.withdrawals.create({ accountId: COINBASE_BANK_ACCOUNT, asset: 'usd', amount: String(amountUsd) })

    // PSEUDOCODE RESPONSE:
    const withdrawal = {
      id: 'withdrawal_PLACEHOLDER',
      status: 'processing',
      amount: String(amountUsd),
      currency: 'usd',
      estimatedArrival: '1-3 business days'
    }

    res.json({ withdrawalId: withdrawal.id, status: withdrawal.status, amount: withdrawal.amount, currency: withdrawal.currency, estimatedArrival: withdrawal.estimatedArrival })
  } catch (err) {
    console.error('withdraw-usd error:', err.details || err.message)
    res.status(err.status || 500).json({ error: err.message, details: err.details })
  }
})

// ---------- 3. CHECK WITHDRAWAL STATUS ----------
router.get('/withdrawal-status/:withdrawalId', async (req, res) => {
  try {
    const { withdrawalId } = req.params

    // REAL SDK CALL (uncomment when SDK is installed):
    // const result = await cdp.withdrawals.get(withdrawalId)

    // PSEUDOCODE RESPONSE:
    const result = { id: withdrawalId, status: 'completed' }

    res.json({ withdrawalId: result.id, status: result.status })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, details: err.details })
  }
})

module.exports = router

/* ---------- wiring notes ----------
 * 1. Install: npm i @coinbase/cdp-sdk express
 * 2. Env vars: CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET,
 *    BASE_ADDRESS, COINBASE_BANK_ACCOUNT
 * 3. Mount: const sell = require('./server/sell-usdc'); app.use('/api/cdp', sell)
 * 4. Flow: sell-usdc ($1,700) -> USD instant -> withdraw-usd -> ACH 1-3 days
 * 5. SANDBOX FIRST. Do not point at a live wallet until a $1 test completes.
 *
 * TIMING ANSWER:
 * - USDC -> USD: instant (same day).
 * - USD -> bank: 1-3 business days (ACH).
 * - The 3-day clock starts when USD hits your bank, not when USDC leaves Base.
 * - Pep Boys gets paid when the ACH clears into your bank account.
 */
