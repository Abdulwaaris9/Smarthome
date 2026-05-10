import { NextRequest } from 'next/server'
import { fetchGoveeLights } from '@/lib/govee'
import { fetchLocalLights } from '@/lib/proxy-client'
import { INITIAL_LIGHTS } from '@/lib/home-config'
import type { Light } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const POLL_INTERVAL_MS = 8000

async function fetchAllLightStates(): Promise<Light[]> {
  const base = INITIAL_LIGHTS

  const goveeIds = base.filter(l => l.brand === 'govee').map(l => l.deviceId)
  const localLights = base.filter(l => l.brand === 'tapo' || l.brand === 'wiz')

  const [goveeStates, localStates] = await Promise.allSettled([
    goveeIds.length > 0 ? fetchGoveeLights() : Promise.resolve([]),
    localLights.length > 0 ? fetchLocalLights(localLights) : Promise.resolve([]),
  ])

  return base.map(light => {
    if (light.brand === 'govee' && goveeStates.status === 'fulfilled') {
      const match = (goveeStates.value as Partial<Light>[]).find(g => g.deviceId === light.deviceId)
      if (match) return { ...light, ...match }
    }
    if ((light.brand === 'tapo' || light.brand === 'wiz') && localStates.status === 'fulfilled') {
      const match = (localStates.value as any[]).find(l => l.ip === light.deviceId || l.deviceId === light.deviceId)
      if (match) return { ...light, ...match, online: match.online }
    }
    return { ...light, online: false }
  })
}

export async function GET(_req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (lights: Light[]) => {
        const data = `event: lights\ndata: ${JSON.stringify(lights)}\n\n`
        controller.enqueue(encoder.encode(data))
      }

      try {
        const lights = await fetchAllLightStates()
        send(lights)
      } catch (e) {
        console.error('SSE initial fetch error:', e)
      }

      const interval = setInterval(async () => {
        try {
          const lights = await fetchAllLightStates()
          send(lights)
        } catch (e) {
          console.error('SSE poll error:', e)
        }
      }, POLL_INTERVAL_MS)

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'))
      }, 20000)

      return () => {
        clearInterval(interval)
        clearInterval(heartbeat)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}