import type { Light, LightCommand } from './types'

function proxyUrl(path: string) {
  const base = process.env.HOME_PROXY_URL?.replace(/\/$/, '')
  if (!base) throw new Error('HOME_PROXY_URL not set')
  return `${base}${path}`
}

function proxyHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-proxy-secret': process.env.HOME_PROXY_SECRET ?? '',
  }
}

export async function fetchLocalLights(lights: Light[]): Promise<any[]> {
  const tapoLights = lights.filter(l => l.brand === 'tapo')
  const wizLights  = lights.filter(l => l.brand === 'wiz')

  const res = await fetch(proxyUrl('/api/state'), {
    method: 'POST',
    headers: proxyHeaders(),
    body: JSON.stringify({
      ips: tapoLights.map(l => l.deviceId),
      wizDeviceIds: wizLights.map(l => l.deviceId),
    }),
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`Proxy state error ${res.status}`)
  return res.json()
}

export async function sendProxyCommand(light: Light, cmd: LightCommand): Promise<void> {
  const res = await fetch(proxyUrl('/api/control'), {
    method: 'POST',
    headers: proxyHeaders(),
    body: JSON.stringify({
      ip: light.brand === 'tapo' ? light.deviceId : undefined,
      deviceId: light.brand === 'wiz' ? light.deviceId : undefined,
      brand: light.brand,
      cmd,
    }),
  })
  if (!res.ok) throw new Error(`Proxy control error ${res.status}`)
}
