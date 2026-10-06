/**
 * Coinbase CDP transfer wiring for Mad Souls Family / I Am merch.
 *
 * Flow:
 *   1. POST /api/cdp/create-transfer  -> quotes a USDC transfer (execute: false)
 *   2. Buyer confirms the quote (fees shown)
 *   3. POST /api/cdp/execute-transfer -> runs the quoted transfer
 *
 * Auth: JWT signed with your CDP API key secret. Wallet signing happens
 * inside Coinbase's secure environment - the wallet secret never leaves it.
 *
 * IMPORTANT: these routes run on a server you control. Never call them
 * from the browser with the API key exposed.
 *
 * Sandbox first: use Coinbase test addresses / test emails before pointing
 * at a live Base wallet. Do not move real funds until a $1 quote completes.
 */

const express = require('express')
const router = express.Router()

// ---------- config (env vars, never hardcoded) ----------
const CDP_API_KEY_ID = process.env.CDP_API_KEY_ID
const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET
const CDP_WALLET_SECRET = process.env.CDP_WALLET_SECRET
const BASE_ADDRESS = process.env.BASE_ADDRESS // your Base wallet, USDC target

const CDP_HOST = 'https://api.cdp.coinbase.com'

// ---------- helpers ----------

/**
 * Build a JWT for CDP REST auth.
 * Header: { alg: 'ES256', kid: keyId, typ: 'JWT' }
 * Payload: { iss: 'cdp', sub: keyId, aud: ['cdp_service'], nbf, exp }
 * Signed with the ES256 private key from your CDP API key secret.
 *
 * In production use the official SDK: npm i @coinbase/cdp-sdk
 *   const { generateJwt } = require('@coinbase/cdp-sdk/auth')
 *   const token = await generateJwt({ apiKeyId, apiKeySecret, requestMethod, requestHost, requestPath })
 */
async function cdpAuth(method, path) {
  // Pseudocode - replace with real ES256 signing or the SDK
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: CDP_API_KEY_ID, typ: 'JWT' })).
    toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(JSON.stringify({ iss: 'cdp', sub: CDP_API_KEY_ID, aud: ['cdp_service'], nbf: now, exp: now + 120 })).
    toString('base64url')
  const signingInput = `${header}.$payload`
  // const signature = await signEs256(signingInput, CDP_API_KEY_SECRET)
  // return `${signingInput}.$signature`
  return signingInput + '.SIGNATURE_PLACEHOLDER'
}

async function cdpFetch(method, path, body) {
  const token = await cdpAuth(method, path)
  const res = await fetch(`${CDP_HOST}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || `CDP ${res.status}`)
    err.status = res.status
    err.details = data
    throw err
  }
  return data
}

// ---------- 1. CREATE TRANSFER (quote only, nothing moves) ----------
/**
 * POST /api/cdp/create-transfer
 * Body: { orderId, amountUsdc, sourceAccountId }
 *
 * Creates a USDC transfer on Base from the buyer's source to your BASE_ADDRESS.
 * execute: false keeps it in 'quoted' status - the buyer sees fees before
 * anything moves. Quote is valid ~10-15 minutes.
 */
router.post('/create-transfer', async (req, res) => {
  try {
    const { orderId, amountUsdc, sourceAccountId } = req.body

    if (!orderId || !amountUsdc || !sourceAccountId) {
      return res.status(400).json({ error: 'orderId, amountUsdc, and sourceAccountId required' })
    }
    if (!BASE_ADDRESS) {
      return res.status(500).json({ error: 'BASE_ADDRESS not configured' })
    }

    const body = {
      source: { accountId: sourceAccountId, asset: 'usdc' },
      target: {
        address: BASE_ADDRESS,
        network: 'base',
        asset: 'usdc'
      },
      amount: String(amountUsdc),
      asset: 'usdc',
      execute: false, // quote only - buyer confirms before anything moves
      metadata: { orderId: String(orderId) }
    }

    const transfer = await cdpFetch('POST', '/platform/v2/transfers', body)

    // transfer.status === 'quoted'
    // transfer.fees = [{ type, amount, currency }, ...]  (network gas, conversion, bank)
    res.json({
      transferId: transfer.id,
      status: transfer.status,
      amount: transfer.amount,
      fees: transfer.fees || [],
      expiresAt: transfer.expiresAt || null
    })
  } catch (err) {
    console.error('create-transfer error:', err.details || err.message)
    res.status(err.status || 500).json({ error: err.message, details: err.details })
  }
})

// ---------- 2. EXECUTE TRANSFER (the page you sent) ----------
/**
 * POST /api/cdp/execute-transfer
 * Body: { transferId }
 *
 * Runs the quoted transfer. Status goes quoted -> processing -> completed|failed.
 * Poll until completed or failed. On completed: mark Shopify order paid, fulfill.
 * On failed: read failureReason, create a NEW transfer - never retry the same id.
 */
router.post('/execute-transfer', async (req, res) => {
  try {
    const { transferId } = req.body
    if (!transferId) {
      return res.status(400).json({ error: 'transferId required' })
    }

    const result = await cdpFetch(
      'POST',
      `/platform/v2/transfers/${encodeURIComponent(transferId)}/execute`
    )

    res.json({ transferId: result.id, status: result.status })
  } catch (err) {
    console.error('execute-transfer error:', err.details || err.message)
    res.status(err.status || 500).json({ error: err.message, details: err.details })
  }
})

// ---------- 3. POLL STATUS ----------
/**
 * GET /api/cdp/transfer-status/:transferId
 * Polls until completed or failed. Call from your server, not the browser.
 */
router.get('/transfer-status/:transferId', async (req, res) => {
  try {
    const { transferId } = req.params
    const result = await cdpFetch(
      'GET',
      `/platform/v2/transfers/${encodeURIComponent(transferId)}`
    )
    res.json({ transferId: result.id, status: result.status, failureReason: result.failureReason || null })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, details: err.details })
  }
})

module.exports = router

/*
 * ---------- wiring notes ----------
 *
 * 1. Install: npm i express
 *    (or use the official SDK: npm i @coinbase/cdp-sdk)
 *
 * 2. Env vars (never commit these):
 *      CDP_API_KEY_ID=your-key-id
 *      CDP_API_KEY_SECRET=your-es256-private-key
 *      CDP_WALLET_SECRET=your-wallet-secret
 *      BASE_ADDRESS=0xYourBaseWallet
 *
 * 3. Mount in your server:
 *      const cdp = require('./server/cdp-transfer')
 *      app.use('/api/cdp', cdp)
 *
 * 4. Storefront flow:
 *      a. Buyer picks a piece (Origin tank $75, MMIW tank $65, jacket $185)
 *      b. Frontend calls POST /api/cdp/create-transfer with orderId + amount
 *      c. Show the buyer: amount + fees. They confirm.
 *      d. Frontend calls POST /api/cdp/execute-transfer with the transferId
 *      e. Poll GET /api/cdp/transfer-status/:id until completed
 *      f. On completed: mark Shopify order paid, send to Printful / cousins
 *
 * 5. Shortcut: create with execute: true quotes and sends in one call.
 *    Use only after the buyer has already confirmed.
 *
 * 6. Tie metadata.orderId to the Shopify order so a completed transfer
 *    cannot be claimed twice.
 *
 * 7. SANDBOX FIRST. Coinbase provides test addresses and test emails.
 *    Do not point this at a live Base wallet until a $1 quote completes.
 */
