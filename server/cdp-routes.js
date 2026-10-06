/**
 * Express route wiring for server/cdp-transfer.js
 *
 * Mount this in your main server file:
 *
 *   const cdpRoutes = require('./server/cdp-routes')
 *   app.use('/api/cdp', cdpRoutes)
 *
 * Then the storefront can call:
 *   POST /api/cdp/create-transfer   { orderId, amountUsdc, sourceAccountId }
 *   POST /api/cdp/execute-transfer  { transferId }
 *   GET  /api/cdp/transfer-status/:transferId
 *
 * Env vars required (never commit these):
 *   CDP_API_KEY_ID
 *   CDP_API_KEY_SECRET
 *   CDP_WALLET_SECRET
 *   BASE_ADDRESS
 */

const express = require('express')
const router = express.Router()
const cdp = require('./cdp-transfer')

// Health check so you can verify the mount without moving money
router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'cdp-transfer', mounted: true })
})

// 1. Quote a transfer (nothing moves)
router.post('/create-transfer', cdp.createTransfer)

// 2. Execute a quoted transfer
router.post('/execute-transfer', cdp.executeTransfer)

// 3. Poll status
router.get('/transfer-status/:transferId', cdp.transferStatus)

module.exports = router

/*
 * Example main server snippet:
 *
 *   const express = require('express')
 *   const app = express()
 *   app.use(express.json())
 *   const cdpRoutes = require('./server/cdp-routes')
 *   app.use('/api/cdp', cdpRoutes)
 *   app.listen(3000, () => console.log('server on :3000'))
 *
 * Test with curl (sandbox only):
 *   curl -X POST http://localhost:3000/api/cdp/health
 *   curl -X POST http://localhost:3000/api/cdp/create-transfer \
 *     -H 'Content-Type: application/json' \
 *     -d '{"orderId":"test-1","amountUsdc":"1.00","sourceAccountId":"account_test"}'
 */