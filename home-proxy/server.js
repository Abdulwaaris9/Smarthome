/**
 * home-proxy/server.js
 *
 * Handles:
 *  - Tapo bulbs via local LAN
 *  - WiZ bulbs via WiZ cloud API
 *
 * Setup:
 *   npm install
 *   node server.js
 *
 * Then expose with Cloudflare Tunnel:
 *   npx cloudflared tunnel --url http://localhost:3001
 */

const express = require('express')
const https = require('https')

const PORT = 3001
const SECRET = process.env.PROXY_SECRET || 'change-me'
const TAPO_EMAIL = process.env.TAPO_EMAIL || ''
const TAPO_PASSWORD = process.env.TAPO_PASSWORD || ''
const WIZ_EMAIL = process.env.WIZ_EMAIL || ''
const WIZ_PASSWORD = process.env.WIZ_PASSWORD || ''

const app = express()
app.use(express.json())

// ── Auth middleware ────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.headers['x-proxy-secret'] !== SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
})

// ── WiZ Cloud API helpers ──────────────────────────────────────
let wizToken = null
let wizTokenExpiry = 0

async function wizRequest(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const options = {
      hostname: 'wiz.com',
      path: `/api/v1/${path}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(wizToken ? { Authorization: `Bearer ${wizToken}` } : {}),
      },
    }
    const req = https.request(options, res => {
      let raw = ''
      res.on('data', chunk => raw += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(raw)) } catch { resolve({}) }
      })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function getWizToken() {
  if (wizToken && Date.now() < wizTokenExpiry) return wizToken
  const res = await wizRequest('login', { email: WIZ_EMAIL, password: WIZ_PASSWORD })
  wizToken = res.token || res.access_token
  wizTokenExpiry = Date.now() + 3600 * 1000
  return wizToken
}

async function getWizDevices() {
  await getWizToken()
  const res = await wizRequest('devices', {})
  return res.devices || res.data || []
}

async function controlWizDevice(deviceId, cmd) {
  await getWizToken()
  const params = {}
  if (cmd.type === 'toggle')     params.state = cmd.on
  if (cmd.type === 'brightness') params.dimming = cmd.value
  if (cmd.type === 'color')      Object.assign(params, { r: cmd.r, g: cmd.g, b: cmd.b, state: true })
  if (cmd.type === 'colorTemp')  Object.assign(params, { temp: cmd.kelvin, state: true })
  return wizRequest(`devices/${deviceId}/command`, { method: 'setPilot', params })
}

// ── Tapo helpers ──────────────────────────────────────────────
async function getTapoState(ip) {
  const { loginDeviceByIp } = require('tp-link-tapo-connect')
  const device = await loginDeviceByIp(TAPO_EMAIL, TAPO_PASSWORD, ip)
  const info = await device.getDeviceInfo()
  return {
    ip,
    brand: 'tapo',
    on: info.device_on,
    brightness: info.brightness ?? 100,
    color: { r: 255, g: 255, b: 220 },
    colorTempK: info.color_temp,
    online: true,
  }
}

async function controlTapo(ip, cmd) {
  const { loginDeviceByIp } = require('tp-link-tapo-connect')
  const device = await loginDeviceByIp(TAPO_EMAIL, TAPO_PASSWORD, ip)
  if (cmd.type === 'toggle')     await (cmd.on ? device.turnOn() : device.turnOff())
  if (cmd.type === 'brightness') await device.setBrightness(cmd.value)
  if (cmd.type === 'colorTemp')  await device.setColorTemperature(cmd.kelvin)
}

// ── Routes ────────────────────────────────────────────────────

// Get state of all devices
app.post('/api/state', async (req, res) => {
  const { ips, wizDeviceIds } = req.body

  const results = []

  // Tapo devices (by IP)
  if (ips && ips.length > 0) {
    const tapoResults = await Promise.allSettled(ips.map(ip => getTapoState(ip)))
    tapoResults.forEach((r, i) => {
      results.push(r.status === 'fulfilled'
        ? r.value
        : { ip: ips[i], online: false, on: false, brightness: 0, color: { r: 0, g: 0, b: 0 }, brand: 'tapo' }
      )
    })
  }

  // WiZ devices (by cloud device ID)
  if (wizDeviceIds && wizDeviceIds.length > 0) {
    try {
      const devices = await getWizDevices()
      for (const id of wizDeviceIds) {
        const d = devices.find(dev => dev.id === id || dev.deviceId === id)
        if (d) {
          results.push({
            deviceId: id,
            brand: 'wiz',
            on: d.state ?? d.on ?? false,
            brightness: d.dimming ?? d.brightness ?? 100,
            color: d.r != null ? { r: d.r, g: d.g, b: d.b } : { r: 255, g: 240, b: 200 },
            colorTempK: d.temp ?? d.colorTempK,
            online: true,
          })
        } else {
          results.push({ deviceId: id, online: false, on: false, brightness: 0, color: { r: 0, g: 0, b: 0 }, brand: 'wiz' })
        }
      }
    } catch (e) {
      console.error('WiZ cloud error:', e)
      for (const id of wizDeviceIds) {
        results.push({ deviceId: id, online: false, on: false, brightness: 0, color: { r: 0, g: 0, b: 0 }, brand: 'wiz' })
      }
    }
  }

  res.json(results)
})

// Control a device
app.post('/api/control', async (req, res) => {
  const { ip, deviceId, brand, cmd } = req.body
  try {
    if (brand === 'tapo') await controlTapo(ip, cmd)
    if (brand === 'wiz')  await controlWizDevice(deviceId, cmd)
    res.json({ ok: true })
  } catch (e) {
    console.error('Control error:', e)
    res.status(500).json({ error: String(e) })
  }
})

app.listen(PORT, () => console.log(`Home proxy running on http://localhost:${PORT}`))
