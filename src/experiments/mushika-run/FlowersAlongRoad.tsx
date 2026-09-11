import { flowerPalette, FLOWER_SIDE_X, nearFlowerGate, worldZ } from './constants'

export const TILE_LEN = 8

function Clump({ colors, x, z }: { colors: readonly string[]; x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {colors.slice(0, 3).map((c, i) => (
        <mesh key={c + i} position={[(i - 1) * 0.16, 0.12 + (i % 2) * 0.04, (i % 3) * 0.1]}>
          <sphereGeometry args={[0.11 - i * 0.015, 8, 8]} />
          <meshStandardMaterial color={c} roughness={0.55} />
        </mesh>
      ))}
    </group>
  )
}

export function FlowersAlongRoad({ distance, tiles }: { distance: number; tiles: number[] }) {
  const { colors } = flowerPalette(distance)
  return (
    <group>
      {tiles.map((i) => {
        const at = i * TILE_LEN + TILE_LEN / 2
        if (nearFlowerGate(at)) return null
        const side: -1 | 1 = i % 2 === 0 ? -1 : 1
        return (
          <group key={`flowers-${i}`} position={[0, 0, worldZ(at, distance)]}>
            <Clump colors={colors} x={side * FLOWER_SIDE_X} z={-1.8} />
            <Clump colors={colors} x={side * FLOWER_SIDE_X} z={0.2} />
            <Clump colors={colors} x={-side * FLOWER_SIDE_X} z={1.6} />
          </group>
        )
      })}
    </group>
  )
}
