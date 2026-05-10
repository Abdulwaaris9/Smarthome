'use client'
import dynamic from 'next/dynamic'
import ControlPanel from '@/components/ControlPanel'
import { useLightStream } from '@/hooks/useLightStream'

// FloorPlan3D uses Three.js — must be client-only, no SSR
const FloorPlan3D = dynamic(() => import('@/components/FloorPlan3D'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
      Loading 3D view…
    </div>
  ),
})

export default function Home() {
  useLightStream()  // connects SSE, keeps store in sync

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0d0d12' }}>

      {/* 3D floor plan — takes most of the screen */}
      <div style={{ flex: 1, position: 'relative' }}>
        <FloorPlan3D />

        {/* Hint overlay */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          fontSize: 11, color: 'rgba(255,255,255,0.25)',
          pointerEvents: 'none',
        }}>
          Drag to orbit · Scroll to zoom · Click a room to select
        </div>

        {/* Live badge */}
        <div style={{
          position: 'absolute', top: 14, left: 14,
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: 'rgba(255,255,255,0.45)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
          live
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        width: 280,
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <ControlPanel />
      </div>
    </div>
  )
}
