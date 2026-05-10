import { NextRequest, NextResponse } from 'next/server'
import { sendGoveeCommand } from '@/lib/govee'
import { sendProxyCommand } from '@/lib/proxy-client'
import { INITIAL_LIGHTS } from '@/lib/home-config'
import type { LightCommand } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { lightId, cmd } = (await req.json()) as { lightId: string; cmd: LightCommand }

  const light = INITIAL_LIGHTS.find(l => l.id === lightId)
  if (!light) return NextResponse.json({ error: 'Light not found' }, { status: 404 })

  try {
    if (light.brand === 'govee') {
      await sendGoveeCommand(light, cmd)
    } else {
      await sendProxyCommand(light, cmd)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Control error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
