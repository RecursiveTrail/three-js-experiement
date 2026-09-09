import { Text } from '@react-three/drei'
import { Suspense } from 'react'
import { assetUrl } from '../../shared/assetUrl'
import { worldZ, type GateId } from './constants'

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
  atDistance,
  distance,
  reached,
}: {
  name: string
  id: GateId
  atDistance: number
  distance: number
  reached: boolean
}) {
  const z = worldZ(atDistance, distance)
  if (z < -28 || z > 10) return null
  const flash = reached && distance - atDistance >= 0 && distance - atDistance < 2
  const saffron = flash ? '#ffc56a' : '#ff8f2a'
  const fontSize = name.length > 14 ? 0.13 : 0.16
  return (
    <group position={[0, 0, z]}>
      {[-2.15, 2.15].map((x) => (
        <mesh key={x} position={[x, 1.2, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 2.4, 8]} />
          <meshStandardMaterial color={saffron} />
        </mesh>
      ))}
      <mesh position={[0, 2.35, 0]}>
        <boxGeometry args={[4.6, 0.28, 0.22]} />
        <meshStandardMaterial
          color="#e24b2c"
          emissive={flash ? '#ff8a28' : '#5a1408'}
          emissiveIntensity={flash ? 0.9 : 0.15}
        />
      </mesh>
      <mesh position={[0, 2.55, 0]} rotation={[0, 0, 0.05]}>
        <torusGeometry args={[0.18, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#e8a317" />
      </mesh>
      <Suspense fallback={null}>
        <Text
          font={LINTEL_FONT}
          position={[0, 2.35, 0.14]}
          fontSize={fontSize}
          color="#3a1208"
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>
      </Suspense>
    </group>
  )
}
