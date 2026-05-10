import type { Light, LightCommand } from './types'

const GOVEE_BASE = 'https://developer-api.govee.com/v1'
const key = () => process.env.GOVEE_API_KEY!

export interface GoveeDevice {
  device: string
  model: string
  deviceName: string
  controllable: boolean
  retrievable: boolean
  supportCmds: string[]
}

// Fetch all Govee devices + their current state
export async function fetchGoveeLights(): Promise<Partial<Light>[]> {
  const [devicesRes, statesRes] = await Promise.all([
    fetch(`${GOVEE_BASE}/devices`, { headers: { 'Govee-API-Key': key() }, next: { revalidate: 0 } }),
    fetch(`${GOVEE_BASE}/devices/state`, { headers: { 'Govee-API-Key': key() }, next: { revalidate: 0 } }),
  ])

  if (!devicesRes.ok) throw new Error(`Govee devices error ${devicesRes.status}`)

  const { data: { devices } } = await devicesRes.json() as { data: { devices: GoveeDevice[] } }

  // State endpoint requires per-device queries in v1 — do them in parallel
  const states = await Promise.allSettled(
    devices.map(d =>
      fetch(`${GOVEE_BASE}/devices/state?device=${encodeURIComponent(d.device)}&model=${d.model}`, {
        headers: { 'Govee-API-Key': key() },
        next: { revalidate: 0 },
      }).then(r => r.json())
    )
  )

  return devices.map((d, i) => {
    const stateResult = states[i]
    const props: Record<string, unknown> = {}
    if (stateResult.status === 'fulfilled') {
      const stateData = stateResult.value?.data?.properties ?? []
      for (const p of stateData) {
        if ('powerState' in p) props.on = p.powerState === 'on'
        if ('brightness' in p) props.brightness = p.brightness
        if ('color' in p) props.color = p.color
        if ('colorTemInKelvin' in p) props.colorTempK = p.colorTemInKelvin
      }
    }
    return {
      deviceId: d.device,
      model: d.model,
      online: true,
      brand: 'govee' as const,
      on: (props.on as boolean) ?? false,
      brightness: (props.brightness as number) ?? 100,
      color: (props.color as Light['color']) ?? { r: 255, g: 200, b: 80 },
      colorTempK: props.colorTempK as number | undefined,
    }
  })
}

// Send command to a Govee device
export async function sendGoveeCommand(light: Light, cmd: LightCommand): Promise<void> {
  let body: object

  switch (cmd.type) {
    case 'toggle':
      body = { name: 'turn', value: cmd.on ? 'on' : 'off' }
      break
    case 'brightness':
      body = { name: 'brightness', value: cmd.value }
      break
    case 'color':
      body = { name: 'color', value: { r: cmd.r, g: cmd.g, b: cmd.b } }
      break
    case 'colorTemp':
      body = { name: 'colorTem', value: cmd.kelvin }
      break
    default:
      return
  }

  const res = await fetch(`${GOVEE_BASE}/devices/control`, {
    method: 'PUT',
    headers: {
      'Govee-API-Key': key(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device: light.deviceId,
      model: light.model,
      cmd: body,
    }),
  })
  if (!res.ok) throw new Error(`Govee control error ${res.status}`)
}
