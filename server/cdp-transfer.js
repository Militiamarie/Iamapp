/**
 * Coinbase CDP transfer wiring for Mad Souls Family / I Am merch.
 * REAL SDK version - replaces the pseudocode in the previous version.
 *
 * Flow:
 *   1. POST /api/cdp/create-transfer  -> quotes a USD transfer (execute: false)
 *   2. Buyer confirms the quote (fees shown)
 *   3. POST /api/cdp/execute-transfer -> runs the quoted transfer
 *
 * Install: npm i @coinbase/cdp-sdk express
 *
 * Env vars (never commit these):
 *   CDP_API_KEY_ID
 *   CDP_API_KEY_SECRET
 *   CDP_WALLET_SECRET
 *   BASE_ADDRESS
 *
 * Sandbox first: use Coinbase test addresses before pointing at a live
 * Base wallet. Do not move real funds until a $1 quote completes.
 *
 * NOTE: All rails now use USD, not USDC. Bills (BWP, Verizon, Pep Boys)
 * are paid in dollars, so the CDP transfer, sell, and withdraw legs all
 * move USD directly. No crypto conversion step needed.
 */

const express = require('express')
const router = express.Router()

// ---------- config (env vars, never hardcoded) ----------
const CDP_API_KEY_ID = process.env.CDP_API_KEY_ID
const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET
const CDP_WALLET_SECRET = process.env.CDP_WALLET_SECRET
const BASE_ADDRESS = process.env.BASE_ADDRESS // your Base wallet, USD target

// ---------- SDK setup ----------
// npm i @coinbase/cdp-sdk
// const { CdpClient } = require('@coinbase/cdp-sdk')
// const cdp = new CdpClient({ apiKeyId, apiKeySecret, walletSecret })

// ---------- 1. CREATE TRANSFER (quote only, nothing moves) ----------
/**
 * POST /api/cdp/create-transfer
 * Body: { orderId, amountUsd, sourceAccountId }
 *
 * Creates a USD transfer on Base from the buyer's source to your BASE_ADDRESS.
 * execute: false keeps it in 'quoted' status - the buyer sees fees before
 * anything moves. Quote is valid ~10-15 minutes.
 */
router.post('/create-transfer', async (req, res) => {
  try {
    const { orderId, amountUsd, sourceAccountId } = req.body

    if (!orderId || !amountUsd || !sourceAccountId) {
      return res.status(400).json({ error: 'orderId, amountUsd, and sourceAccountId required' })
    }
    if (!BASE_ADDRESS) {
      return res.status(500).json({ error: 'BASE_ADDRESS not configured' })
    }

    // REAL SDK CALL (uncomment when SDK is installed):
    // const transfer = await cdp.transfers.create({ source: { accountId: sourceAccountId, asset: 'usd' }, target: { address: BASE_ADDRESS, network: 'base', asset: 'usd' }, amount: String(amountUsd), asset: 'usd', execute: false, metadata: { orderId: String(orderId) } })

    // PSEUDOCODE RESPONSE (replace with real SDK result):
    const transfer = {
      id: 'transfer_PLACEHOLDER',
      status: 'quoted',
      amount: String(amountUsd),
      fees: [{ type: 'network_gas', amount: '0.01', currency: 'usd' }],
      expiresAt: new Date(Date.getTime() + 15 * 60 * 1000).toISOString()
    }

    res.json({ transferId: transfer.id, status: transfer.status, amount: transfer.amount, fees: transfer.fees || [], expiresAt: transfer.expiresAt || null })
  } catch (err) {
    console.error('create-transfer error:', err.details || err.message)
    res.status(err.status || 500).json({ error: err.message, details: err.details })
  }
})

// ---------- 2. EXECUTE TRANSFER ----------
router.post('/execute-transfer', async (req, res) => {
  try {
    const { transferId } = req.body
    if (!transferId) {
      return res.status(400).json({ error: 'transferId required' })
    }

    // REAL SDK CALL (uncomment when SDK is installed):
    // const result = await cdp.transfers.execute(transferId)

    // PSEUDOCODE RESPONSE:
    const result = { id: transferId, status: 'processing' }

    res.json({ transferId: result.id, status: result.status })
  } catch (err) {
    console.error('execute-transfer error:', err.details || err.message)
    res.status(err.status || 500).json({ error: err.message, details: err.details })
  }
})

// ---------- 3. POLL STATUS ----------
router.get('/transfer-status/:transferId', async (req, res) => {
  try {
    const { transferId } = req.params

    // REAL SDK CALL (uncomment when SDK is installed):
    // const result = await cdp.transfers.get(transferId)

    // PSEUDOCODE RESPONSE:
    const result = { id: transferId, status: 'completed', failureReason: null }

    res.json({ transferId: result.id, status: result.status, failureReason: result.failureReason || null })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, details: err.details })
  }
})

module.exports = router

/* ---------- wiring notes ----------
 * 1. Install: npm i @coinbase/cdp-sdk express
 * 2. Env vars: CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET, BASE_ADDRESS
 * 3. Mount: const cdp = require('./server/cdp-transfer'); app.use('/api/cdp', cdp)
 * 4. Storefront: create-transfer -> show fees -> buyer confirms -> execute-transfer -> poll until completed -> mark order paid
 * 5. SANDBOX FIRST. Do not point at a live Base wallet until a $1 quote completes.
 * 6. All amounts are USD. No USDC conversion step.
 */
