'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useHomeStore } from '@/lib/store'
import type { Room, Light } from '@/lib/types'

const WALL_HEIGHT = 2.5
const WALL_THICKNESS = 0.12
const FLOOR_COLOR = '#1a1a1f'
const WALL_COLOR = '#2a2a35'
const SELECTED_WALL = '#3a3a50'

// Glow sprite for each light
function LightGlow({ light, roomCenterX, roomCenterZ }: {
  light: Light
  roomCenterX: number
  roomCenterZ: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { r, g, b } = light.color
  const color = new THREE.Color(r / 255, g / 255, b / 255)

  useFrame(({ clock }) => {
    if (meshRef.current && light.on) {
      meshRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2) * 0.05)
    }
  })

  if (!light.on) return null

  return (
    <group position={[roomCenterX, WALL_HEIGHT * 0.95, roomCenterZ]}>
      {/* Point light casting colored light on floor */}
      <pointLight
        color={color}
        intensity={light.brightness / 100 * 2}
        distance={6}
        decay={2}
      />
      {/* Visual dot on ceiling */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

// Animated floor glow under lit rooms
function FloorGlow({ room, lights }: { room: Room; lights: Light[] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const activeLights = lights.filter(l => l.on && l.roomId === room.id)

  const blendedColor = useMemo(() => {
    if (activeLights.length === 0) return new THREE.Color(0, 0, 0)
    const avg = activeLights.reduce(
      (acc, l) => ({ r: acc.r + l.color.r, g: acc.g + l.color.g, b: acc.b + l.color.b }),
      { r: 0, g: 0, b: 0 }
    )
    return new THREE.Color(
      avg.r / activeLights.length / 255,
      avg.g / activeLights.length / 255,
      avg.b / activeLights.length / 255,
    )
  }, [activeLights])

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      const pulse = activeLights.length > 0 ? 0.12 + Math.sin(clock.elapsedTime * 1.5) * 0.03 : 0
      mat.opacity = pulse
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={[room.x + room.width / 2, 0.01, room.z + room.depth / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[room.width * 0.9, room.depth * 0.9]} />
      <meshBasicMaterial color={blendedColor} transparent opacity={0} />
    </mesh>
  )
}

function RoomBox({ room, isSelected, onClick, lights }: {
  room: Room
  isSelected: boolean
  onClick: () => void
  lights: Light[]
}) {
  const cx = room.x + room.width / 2
  const cz = room.z + room.depth / 2
  const wallColor = isSelected ? SELECTED_WALL : WALL_COLOR

  return (
    <group onClick={onClick}>
      {/* Floor */}
      <mesh position={[cx, 0, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[room.width, room.depth]} />
        <meshStandardMaterial color={isSelected ? '#22223a' : FLOOR_COLOR} />
      </mesh>

      {/* Walls — 4 sides, open-top box look */}
      {/* Front */}
      <mesh position={[cx, WALL_HEIGHT / 2, room.z]}>
        <boxGeometry args={[room.width, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      {/* Back */}
      <mesh position={[cx, WALL_HEIGHT / 2, room.z + room.depth]}>
        <boxGeometry args={[room.width, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      {/* Left */}
      <mesh position={[room.x, WALL_HEIGHT / 2, cz]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, room.depth]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      {/* Right */}
      <mesh position={[room.x + room.width, WALL_HEIGHT / 2, cz]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, room.depth]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Room label */}
      <Text
        position={[cx, 0.05, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.28}
        color={isSelected ? '#9090ff' : '#555566'}
        anchorX="center"
        anchorY="middle"
      >
        {room.name}
      </Text>

      {/* Lights */}
      {lights
        .filter(l => l.roomId === room.id)
        .map((light, i) => (
          <LightGlow
            key={light.id}
            light={light}
            roomCenterX={cx + (i - 0.5) * 0.8}
            roomCenterZ={cz}
          />
        ))}

      {/* Floor glow */}
      <FloorGlow room={room} lights={lights} />
    </group>
  )
}

export default function FloorPlan3D() {
  const { rooms, lights, selectedRoomId, selectRoom } = useHomeStore(s => ({
    rooms: s.rooms,
    lights: Object.values(s.lights),
    selectedRoomId: s.selectedRoomId,
    selectRoom: s.selectRoom,
  }))

  // Find bounding box to center camera
  const maxX = Math.max(...rooms.map(r => r.x + r.width))
  const maxZ = Math.max(...rooms.map(r => r.z + r.depth))
  const centerX = maxX / 2
  const centerZ = maxZ / 2

  return (
    <Canvas
      camera={{ position: [centerX, 14, centerZ + 10], fov: 45 }}
      shadows
      style={{ background: '#0d0d12' }}
    >
      <ambientLight intensity={0.15} />
      <directionalLight position={[10, 20, 10]} intensity={0.3} castShadow />

      {rooms.map(room => (
        <RoomBox
          key={room.id}
          room={room}
          isSelected={selectedRoomId === room.id}
          onClick={() => selectRoom(selectedRoomId === room.id ? null : room.id)}
          lights={lights}
        />
      ))}

      <OrbitControls
        target={[centerX, 0, centerZ]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={5}
        maxDistance={35}
        enablePan
      />
    </Canvas>
  )
}
