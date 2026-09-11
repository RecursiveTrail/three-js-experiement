import { Text } from '@react-three/drei'
import { Suspense } from 'react'
import { assetUrl } from '../../shared/assetUrl'
import { doorOpenT, worldZ, type GateId, type Phase } from './constants'

export const LINTEL_FONT = assetUrl('assets/mushika-run/fonts/inter-latin-400-normal.woff')

export function LintelFontPreload() {
  return (
    <Suspense fallback={null}>
      <Text font={LINTEL_FONT} fontSize={0.01} position={[0, -40, 0]} visible={false}>
        Siddhivinayak
      </Text>
    </Suspense>
  )
}

export function Gate({
  name,
  id,
  atDistance,
  distance,
  reached,
  phase,
  openingT,
  liveId,
}: {
  name: string
  id: GateId
  atDistance: number
  distance: number
  reached: boolean
  phase: Phase
  openingT: number | null
  liveId: GateId | undefined
}) {
  const z = worldZ(atDistance, distance)
  if (z < -28 || z > 10) return null
  const open = doorOpenT({ id, reached, phase, openingT, liveId })
  const fontSize = name.length > 14 ? 0.13 : 0.16
  return (
    <group position={[0, 0, z]}>
      {[-2.15, 2.15].map((x) => (
        <mesh key={x} position={[x, 1.2, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 2.4, 8]} />
          <meshStandardMaterial color="#ff8f2a" />
        </mesh>
      ))}
      <mesh position={[0, 2.35, 0]}>
        <boxGeometry args={[4.6, 0.28, 0.22]} />
        <meshStandardMaterial color="#e24b2c" emissive="#5a1408" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 2.55, 0]} rotation={[0, 0, 0.05]}>
        <torusGeometry args={[0.18, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#e8a317" />
      </mesh>
      <group position={[-2.15, 0, 0]} rotation={[0, -Math.PI / 2 * open, 0]}>
        <mesh position={[1.05, 1.1, 0]}>
          <boxGeometry args={[2.1, 2.15, 0.08]} />
          <meshStandardMaterial color="#7a3a18" />
        </mesh>
      </group>
      <group position={[2.15, 0, 0]} rotation={[0, Math.PI / 2 * open, 0]}>
        <mesh position={[-1.05, 1.1, 0]}>
          <boxGeometry args={[2.1, 2.15, 0.08]} />
          <meshStandardMaterial color="#7a3a18" />
        </mesh>
      </group>
      <Suspense fallback={null}>
        <Text font={LINTEL_FONT} position={[0, 2.35, 0.14]} fontSize={fontSize} color="#3a1208" anchorX="center" anchorY="middle">
          {name}
        </Text>
      </Suspense>
    </group>
  )
}
