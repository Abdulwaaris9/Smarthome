export type Brand = 'govee' | 'tapo' | 'wiz'

export interface LightColor {
  r: number  // 0-255
  g: number
  b: number
}

export interface Light {
  id: string
  name: string
  brand: Brand
  roomId: string
  on: boolean
  brightness: number   // 0-100
  color: LightColor
  colorTempK?: number  // e.g. 2700–6500
  online: boolean
  // Raw device id used by the brand's API
  deviceId: string
  model?: string
}

export interface Room {
  id: string
  name: string
  // 3D position in the floor plan (metres from origin)
  x: number
  z: number
  width: number
  depth: number
  height?: number  // default 2.5
}

export interface HomeState {
  lights: Record<string, Light>
  rooms: Room[]
  selectedRoomId: string | null
}

export type LightCommand =
  | { type: 'toggle'; on: boolean }
  | { type: 'brightness'; value: number }
  | { type: 'color'; r: number; g: number; b: number }
  | { type: 'colorTemp'; kelvin: number }
  | { type: 'scene'; name: string }
