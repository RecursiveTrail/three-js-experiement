import { useTexture } from '@react-three/drei'
import { useLayoutEffect } from 'react'
import { DoubleSide, SRGBColorSpace } from 'three'
import { assetUrl } from '../../shared/assetUrl'
import { GATES, worldZ } from './constants'

export const TILE_LEN = 8

const URLS = [1, 2, 3, 4, 5, 6, 7].map((n) => assetUrl(`assets/mushika-run/ganpati/ganpati-${n}.jpg`))

const W = 1.38
const H = 2.4
const SIDE_X = 3.2
const YAW = 0.46
const GATE_CLEAR = 10

function nearGate(atDistance: number): boolean {
  return GATES.some((g) => Math.abs(g.distance - atDistance) < GATE_CLEAR)
}

export function GanpatiAlongRoad({ distance, tiles }: { distance: number; tiles: number[] }) {
  const maps = useTexture(URLS)
  useLayoutEffect(() => {
    for (const t of maps) t.colorSpace = SRGBColorSpace
  }, [maps])

  return (
    <group>
      {tiles.map((i) => {
        const at = i * TILE_LEN + TILE_LEN / 2
        if (nearGate(at)) return null
        const side: -1 | 1 = i % 2 === 0 ? -1 : 1
        const tex = maps[((i * 3 + (side === 1 ? 4 : 0)) % maps.length + maps.length) % maps.length]!
        const scale = 1.05 + (Math.abs(i) % 3) * 0.08
        return (
          <group
            key={`ganpati-${i}`}
            position={[side * SIDE_X, 0, worldZ(at, distance)]}
            rotation={[0, -side * YAW, 0]}
            scale={scale}
          >
            <mesh position={[0, 0.08, 0]}>
              <boxGeometry args={[0.85, 0.12, 0.22]} />
              <meshStandardMaterial color="#ef6c00" />
            </mesh>
            <mesh position={[0, H / 2 + 0.1, -0.03]}>
              <planeGeometry args={[W + 0.1, H + 0.1]} />
              <meshStandardMaterial color="#ffd978" metalness={0.35} roughness={0.4} />
            </mesh>
            <mesh position={[0, H / 2 + 0.1, 0]}>
              <planeGeometry args={[W, H]} />
              <meshStandardMaterial map={tex} side={DoubleSide} roughness={0.55} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
