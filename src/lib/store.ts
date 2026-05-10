import { create } from 'zustand'
import type { Light, Room } from './types'
import { ROOMS, INITIAL_LIGHTS } from './home-config'

interface HomeStore {
  lights: Record<string, Light>
  rooms: Room[]
  selectedRoomId: string | null
  isLoading: boolean

  setLights: (lights: Light[]) => void
  updateLight: (id: string, patch: Partial<Light>) => void
  selectRoom: (id: string | null) => void
  setLoading: (v: boolean) => void
}

export const useHomeStore = create<HomeStore>((set) => ({
  lights: Object.fromEntries(INITIAL_LIGHTS.map(l => [l.id, l])),
  rooms: ROOMS,
  selectedRoomId: null,
  isLoading: false,

  setLights: (lights) =>
    set((s) => ({
      lights: {
        ...s.lights,
        ...Object.fromEntries(lights.map(l => [l.id, { ...s.lights[l.id], ...l }])),
      },
    })),

  updateLight: (id, patch) =>
    set((s) => ({
      lights: { ...s.lights, [id]: { ...s.lights[id], ...patch } },
    })),

  selectRoom: (selectedRoomId) => set({ selectedRoomId }),
  setLoading: (isLoading) => set({ isLoading }),
}))
