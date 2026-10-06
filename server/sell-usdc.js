/**
 * USD rails for Mad Souls Family / I Am merch.
 * Renamed from sell-usdc.js — all rails now move USD directly.
 * No crypto conversion step: CDP transfers USD, and the Coinbase card
 * spends USD from the Coinbase fiat balance.
 *
 * Install: npm i @coinbase/cdp-sdk
 *
 * Env vars (never commit):
 *   CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET
 *   BASE_ADDRESS          - your Base wallet holding the USD
 *   COINBASE_BANK_ACCOUNT - your linked bank account id (from Coinbase)
 *
 * Timing:
 *   - USD -> bank account: 1-3 business days (ACH) if you withdraw.
 *   - Faster: spend directly with the Coinbase card from the fiat balance.
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

// ---------- 1. TRANSFER USD -> COINBASE FIAT (instant) ----------
/**
 * POST /api/cdp/transfer-usd
 * Body: { amountUsd }
 *
 * Transfers USD from the CDP account to the Coinbase fiat balance.
 * Instant — the USD is spendable immediately with the Coinbase card.
 */
router.post('/transfer-usd', async (req, res) => {
  try {
    const { amountUsd } = req.body
    if (!amountUsd) {
      return res.status(400).json({ error: 'amountUsd required' })
    }
    if (!BASE_ADDRESS) {
      return res.status(500).json({ error: 'BASE_ADDRESS not configured' })
    }

    // REAL SDK CALL (uncomment when SDK is installed):
    // const transfer = await cdp.transfers.create({ source: { accountId: CDP_ACCOUNT_ID, asset: 'usd' }, target: { address: BASE_ADDRESS, network: 'base', asset: 'usd' }, amount: String(amountUsd), asset: 'usd', execute: true })

    // PSEUDOCODE RESPONSE:
    const transfer = {
      id: 'transfer_PLACEHOLDER',
      status: 'completed',
      amount: String(amountUsd),
      currency: 'usd'
    }

    res.json({ transferId: transfer.id, status: transfer.status, amount: transfer.amount, currency: transfer.currency })
  } catch (err) {
    console.error('transfer-usd error:', err.details || err.message)
    res.status(err.status || 500).json({ error: err.message, details: err.details })
  }
})

// ---------- 2. WITHDRAW USD -> BANK (1-3 business days, optional) ----------
/**
 * POST /api/cdp/withdraw-usd
 * Body: { amountUsd }
 *
 * Withdraws USD from your Coinbase fiat balance to your linked bank.
 * ACH takes 1-3 business days. Only needed if you want bank funds
 * instead of spending with the Coinbase card.
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
 * 4. Flow: transfer-usd ($2,849) -> USD instant in Coinbase fiat -> spend with Coinbase card
 * 5. SANDBOX FIRST. Do not point at a live wallet until a $1 test completes.
 * 6. All amounts are USD. No USDC conversion step.
 * 7. The Coinbase card spends directly from the fiat balance — no ACH wait.
 */
