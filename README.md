# 🏠 Smart Home Dashboard

A 3D rotatable floor plan with real-time light controls for **Govee**, **TP-Link Tapo**, and **WiZ** — hosted on Vercel, accessible anywhere.

---

## Architecture

```
Browser ──SSE──► Vercel (Next.js) ──► Govee Cloud API
                      │
                      └──HTTPS──► Home Proxy (your PC/Pi) ──UDP──► WiZ bulbs
                                                            ──LAN──► Tapo bulbs
```

---

## Quick Start

### 1. Get a Govee API key
1. Open the **Govee Home** app
2. Go to **Me → About Us → Apply for API Key**
3. Enter your email — you'll receive the key within minutes

### 2. Set up the Home Proxy (for Tapo + WiZ)

On a PC or Raspberry Pi that's always on at home:

```bash
cd home-proxy
npm install

# Set your credentials
export PROXY_SECRET="pick-any-random-string"
export TAPO_EMAIL="your@email.com"
export TAPO_PASSWORD="your-tapo-password"
# Comma-separated IPs of your Tapo bulbs (so the proxy knows which brand each IP is)
export TAPO_IPS="192.168.1.110,192.168.1.111,192.168.1.112"

node server.js
```

Then expose it with Cloudflare Tunnel (free, no account needed for quick tunnels):
```bash
npx cloudflared tunnel --url http://localhost:3001
```
Copy the `https://xxxx.trycloudflare.com` URL — you'll need it below.

> **Tip**: For a permanent URL, create a free Cloudflare account and set up a named tunnel.

### 3. Configure your lights

Edit `src/lib/home-config.ts`:

- **Rooms**: Adjust `x`, `z`, `width`, `depth` to match your actual floor plan (in metres)
- **Lights**: Replace the `deviceId` values:
  - Govee: open **Govee Home app → Device → Settings → About** — copy the MAC address
  - Tapo/WiZ: use each bulb's static IP (assign these in your router's DHCP settings)
  - Replace the `model` field for Govee devices (shown in the app)

### 4. Deploy to Vercel

```bash
npm install
# Copy and fill in your secrets
cp .env.local.example .env.local

# Push to GitHub, then:
vercel deploy
```

Set these environment variables in your Vercel project dashboard:
| Variable | Value |
|---|---|
| `GOVEE_API_KEY` | Your Govee API key |
| `HOME_PROXY_URL` | Your Cloudflare tunnel URL |
| `HOME_PROXY_SECRET` | Same string you set on the proxy |
| `TAPO_EMAIL` | Your TP-Link account email |
| `TAPO_PASSWORD` | Your TP-Link account password |

---

## Usage

- **Orbit**: drag to rotate the 3D view
- **Zoom**: scroll wheel
- **Click a room**: selects it and filters the right panel to that room's lights
- **Toggle**: flip the switch on any light
- **Brightness**: drag the slider
- **Color**: click a color swatch
- **Scenes**: applies a preset to all lights in the selected room (or all rooms)

Light states refresh automatically every **8 seconds** via Server-Sent Events.

---

## Customising the 3D Floor Plan

The floor plan is defined purely in `src/lib/home-config.ts` — no 3D modelling needed. Each room is a box with a position and size in metres:

```ts
{ id: 'living', name: 'Living Room', x: 0, z: 0, width: 6, depth: 5 }
```

Sketch your apartment on paper, measure the rooms, and fill in the numbers.

---

## Adding More Lights

1. Add an entry to the `INITIAL_LIGHTS` array in `src/lib/home-config.ts`
2. Set `brand: 'govee' | 'tapo' | 'wiz'`
3. Set the correct `deviceId` (MAC for Govee, IP for Tapo/WiZ)
4. Done — it appears in the 3D view and panel automatically

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, React, Three.js, @react-three/fiber |
| State | Zustand |
| Real-time | Server-Sent Events (SSE) |
| Govee | Official Govee Developer API |
| Tapo | `tplink-tapo-connect` (local LAN) |
| WiZ | UDP local API |
| Hosting | Vercel |
| Local relay | Node.js + Cloudflare Tunnel | 
