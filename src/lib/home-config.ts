import type { Room, Light } from './types'

export const ROOMS: Room[] = [
  { id: 'girls-room',   name: "Girls' Room",    x: 0,    z: 0,   width: 4.5, depth: 4.5 },
  { id: 'boys-room',    name: "Boys' Room",     x: 4.7,  z: 0,   width: 4.5, depth: 4.5 },
  { id: 'hall',         name: 'Hall',           x: 9.4,  z: 0,   width: 5,   depth: 4.5 },
  { id: 'passage',      name: 'Passage',        x: 14.6, z: 0,   width: 2,   depth: 4.5 },
  { id: 'pool-room',    name: 'Pool Room',      x: 16.8, z: 0,   width: 4.2, depth: 4.5 },
  { id: 'drawing-room', name: 'Drawing Room',   x: 0,    z: 4.7, width: 9.2, depth: 5.3 },
  { id: 'entrance',     name: 'Entrance',       x: 9.4,  z: 4.7, width: 2.8, depth: 5.3 },
  { id: 'kitchen',      name: 'Kitchen',        x: 12.4, z: 4.7, width: 4.2, depth: 3.5 },
  { id: 'master-bed',   name: 'Master Bedroom', x: 16.8, z: 4.7, width: 4.2, depth: 5.3 },
  { id: 'laundry',      name: 'Laundry',        x: 12.4, z: 8.4, width: 4.2, depth: 1.6 },
]

// ─────────────────────────────────────────────────────────────
//  LIGHTS (WiZ skipped for now — add later when you have MACs)
//
//  Boys' Room:  3 Govee strips
//  Hall:        2 Tapo bulbs
//
//  GOVEE Device ID: Govee app → tap device → ⚙️ → About → Device ID
//  TAPO IP:         your router → Connected Devices → bulb IP
// ─────────────────────────────────────────────────────────────
export const INITIAL_LIGHTS: Light[] = [

  // ── Boys' Room ── 3 Govee strips ─────────────────────────
  {
    id: 'Desk Light',
    name: 'Strip 1',
    brand: 'govee',
    roomId: 'boys-room',
    on: false,
    brightness: 80,
    color: { r: 100, g: 160, b: 255 },
    online: false,
    deviceId: 'D4:AD:FC:F9:C4:06',   // ← REPLACE with Govee Device ID
    model: 'H6159',
  },
  {
    id: 'M1',
    name: 'Strip 2',
    brand: 'govee',
    roomId: 'boys-room',
    on: false,
    brightness: 80,
    color: { r: 80, g: 120, b: 255 },
    online: false,
    deviceId: '60:74:F4:0B:4B:72',   // ← REPLACE
    model: 'H6159',
  },
  {
    id: 'Wall Light',
    name: 'Strip 3',
    brand: 'govee',
    roomId: 'boys-room',
    on: false,
    brightness: 80,
    color: { r: 60, g: 100, b: 255 },
    online: false,
    deviceId: 'D0:C9:07:3B:E5:40',   // ← REPLACE
    model: 'H6159',
  },

  // ── Hall ── 2 Tapo bulbs ──────────────────────────────────
  {
    id: 'hall-bulb-1',
    name: 'Bulb 1',
    brand: 'tapo',
    roomId: 'hall',
    on: false,
    brightness: 100,
    color: { r: 255, g: 250, b: 220 },
    colorTempK: 4000,
    online: false,
    deviceId: '192.168.1.44',              // ← REPLACE with Tapo IP
  },
  {
    id: 'hall-bulb-2',
    name: 'Bulb 2',
    brand: 'tapo',
    roomId: 'hall',
    on: false,
    brightness: 100,
    color: { r: 255, g: 250, b: 220 },
    colorTempK: 4000,
    online: false,
    deviceId: '192.168.1.45',              // ← REPLACE with Tapo IP
  },
]
