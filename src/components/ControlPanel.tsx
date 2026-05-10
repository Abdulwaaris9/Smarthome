'use client'
import { useCallback } from 'react'
import { useHomeStore } from '@/lib/store'
import type { Light, LightCommand } from '@/lib/types'
import clsx from 'clsx'

const BRAND_COLORS: Record<string, string> = {
  govee: 'bg-blue-950 text-blue-300',
  tapo: 'bg-green-950 text-green-300',
  wiz: 'bg-amber-950 text-amber-300',
}

const SCENE_PRESETS = [
  { name: 'Evening',  icon: '🌆', colors: [{ r: 255, g: 140, b: 40 }], brightness: 60 },
  { name: 'Movie',    icon: '🎬', colors: [{ r: 60, g: 10, b: 120 }], brightness: 20 },
  { name: 'Sleep',    icon: '🌙', colors: [{ r: 255, g: 80, b: 20 }], brightness: 5 },
  { name: 'Focus',    icon: '💡', colors: [{ r: 255, g: 255, b: 220 }], brightness: 100 },
  { name: 'Party',    icon: '🎉', colors: [{ r: 255, g: 0, b: 128 }], brightness: 80 },
]

const COLOR_SWATCHES = [
  { label: 'Warm',   r: 255, g: 200, b: 80  },
  { label: 'Cool',   r: 220, g: 240, b: 255 },
  { label: 'Red',    r: 255, g: 50,  b: 50  },
  { label: 'Blue',   r: 80,  g: 160, b: 255 },
  { label: 'Green',  r: 60,  g: 220, b: 100 },
  { label: 'Purple', r: 180, g: 80,  b: 255 },
  { label: 'Pink',   r: 255, g: 100, b: 180 },
]

async function sendCommand(lightId: string, cmd: LightCommand) {
  await fetch('/api/lights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lightId, cmd }),
  })
}

function LightRow({ light }: { light: Light }) {
  const updateLight = useHomeStore(s => s.updateLight)

  const toggle = useCallback(async () => {
    const next = !light.on
    updateLight(light.id, { on: next })
    await sendCommand(light.id, { type: 'toggle', on: next })
  }, [light, updateLight])

  const setBrightness = useCallback(async (value: number) => {
    updateLight(light.id, { brightness: value })
    await sendCommand(light.id, { type: 'brightness', value })
  }, [light.id, updateLight])

  const setColor = useCallback(async (r: number, g: number, b: number) => {
    updateLight(light.id, { color: { r, g, b } })
    await sendCommand(light.id, { type: 'color', r, g, b })
  }, [light.id, updateLight])

  const { r, g, b } = light.color
  const swatchColor = `rgb(${r},${g},${b})`

  return (
    <div className={clsx(
      'rounded-xl border p-3 mb-2 transition-all',
      light.on
        ? 'border-white/10 bg-white/5'
        : 'border-white/5 bg-white/[0.02] opacity-60'
    )}>
      <div className="flex items-center gap-2 mb-2">
        {/* Color swatch */}
        <div
          className="w-4 h-4 rounded-full flex-shrink-0 border border-white/20"
          style={{ background: swatchColor }}
        />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white/90 truncate block">{light.name}</span>
          <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full font-medium', BRAND_COLORS[light.brand])}>
            {light.brand}
          </span>
        </div>
        {/* Online indicator */}
        <div className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', light.online ? 'bg-green-400' : 'bg-red-400/60')} />
        {/* Toggle */}
        <button
          onClick={toggle}
          className={clsx(
            'w-10 h-5 rounded-full relative transition-colors flex-shrink-0',
            light.on ? 'bg-amber-400' : 'bg-white/20'
          )}
        >
          <div className={clsx(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
            light.on ? 'left-5' : 'left-0.5'
          )} />
        </button>
      </div>

      {light.on && (
        <div className="space-y-2 mt-2 pt-2 border-t border-white/5">
          {/* Brightness */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/40 w-16 flex-shrink-0">Brightness</span>
            <input
              type="range" min={1} max={100} step={1}
              value={light.brightness}
              onChange={e => setBrightness(Number(e.target.value))}
              className="flex-1 accent-amber-400"
            />
            <span className="text-[11px] text-white/60 w-8 text-right">{light.brightness}%</span>
          </div>

          {/* Color swatches */}
          <div className="flex gap-1.5 flex-wrap">
            {COLOR_SWATCHES.map(sw => (
              <button
                key={sw.label}
                title={sw.label}
                onClick={() => setColor(sw.r, sw.g, sw.b)}
                className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform"
                style={{ background: `rgb(${sw.r},${sw.g},${sw.b})` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ControlPanel() {
  const { rooms, lights, selectedRoomId, updateLight } = useHomeStore(s => ({
    rooms: s.rooms,
    lights: s.lights,
    selectedRoomId: s.selectedRoomId,
    updateLight: s.updateLight,
  }))

  const allLights = Object.values(lights)
  const roomLights = selectedRoomId
    ? allLights.filter(l => l.roomId === selectedRoomId)
    : allLights

  const selectedRoom = rooms.find(r => r.id === selectedRoomId)

  const applyScene = useCallback(async (scene: typeof SCENE_PRESETS[0]) => {
    for (const light of roomLights) {
      const color = scene.colors[0]
      updateLight(light.id, { on: true, brightness: scene.brightness, color })
      await sendCommand(light.id, { type: 'toggle', on: true })
      await sendCommand(light.id, { type: 'brightness', value: scene.brightness })
      await sendCommand(light.id, { type: 'color', ...color })
    }
  }, [roomLights, updateLight])

  const onlineCounts = {
    govee: allLights.filter(l => l.brand === 'govee' && l.online).length,
    tapo:  allLights.filter(l => l.brand === 'tapo'  && l.online).length,
    wiz:   allLights.filter(l => l.brand === 'wiz'   && l.online).length,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
            {selectedRoom ? selectedRoom.name : 'All Rooms'}
          </span>
          {selectedRoomId && (
            <button
              onClick={() => useHomeStore.getState().selectRoom(null)}
              className="text-[10px] text-white/30 hover:text-white/60 ml-auto"
            >
              show all ×
            </button>
          )}
        </div>
        <div className="text-[11px] text-white/30">{roomLights.length} lights</div>
      </div>

      {/* Scenes */}
      <div className="px-3 py-3 border-b border-white/10">
        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Scenes</div>
        <div className="flex flex-wrap gap-1.5">
          {SCENE_PRESETS.map(scene => (
            <button
              key={scene.name}
              onClick={() => applyScene(scene)}
              className="text-xs px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-amber-400/40 transition-all"
            >
              {scene.icon} {scene.name}
            </button>
          ))}
        </div>
      </div>

      {/* Light list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {roomLights.map(light => (
          <LightRow key={light.id} light={light} />
        ))}
      </div>

      {/* Status footer */}
      <div className="px-3 py-2 border-t border-white/10 bg-white/[0.02]">
        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1.5">Devices</div>
        <div className="space-y-1">
          {(['govee','tapo','wiz'] as const).map(brand => (
            <div key={brand} className="flex items-center gap-2 text-[11px] text-white/40">
              <div className={clsx('w-1.5 h-1.5 rounded-full', onlineCounts[brand] > 0 ? 'bg-green-400' : 'bg-white/20')} />
              <span className="capitalize">{brand}</span>
              <span className="ml-auto">{onlineCounts[brand]} online</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
