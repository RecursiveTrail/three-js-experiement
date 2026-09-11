import { flowerBedXs, flowerBedZs, flowerPalette, nearFlowerGate, worldZ } from './constants'

export const TILE_LEN = 8

function Clump({ colors, x, z }: { colors: readonly string[]; x: number; z: number }) {
  const leaf = colors[colors.length - 1] ?? '#5ea04a'
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.38, 8, 8]} />
        <meshStandardMaterial color={leaf} roughness={0.7} />
      </mesh>
      <mesh position={[0.22, 0.38, 0.1]}>
        <sphereGeometry args={[0.3, 7, 7]} />
        <meshStandardMaterial color={colors[0]} roughness={0.5} />
      </mesh>
      <mesh position={[-0.2, 0.34, 0.12]}>
        <sphereGeometry args={[0.26, 7, 7]} />
        <meshStandardMaterial color={colors[1 % colors.length]} roughness={0.5} />
      </mesh>
    </group>
  )
}

export function FlowersAlongRoad({ distance, tiles }: { distance: number; tiles: number[] }) {
  const { colors } = flowerPalette(distance)
  const xs = flowerBedXs()
  const zs = flowerBedZs(TILE_LEN)
  const leaf = colors[colors.length - 1] ?? '#5ea04a'
  return (
    <group>
      {tiles.map((i) => {
        const at = i * TILE_LEN + TILE_LEN / 2
        if (nearFlowerGate(at)) return null
        const tileZ = worldZ(at, distance)
        if (tileZ > 1.2) return null
        return (
          <group key={`flowers-${i}`} position={[0, 0, tileZ]}>
            {([-1, 1] as const).map((side) => (
              <group key={side}>
                <mesh position={[side * 3.72, 0.2, 0]}>
                  <boxGeometry args={[2.55, 0.4, TILE_LEN * 0.96]} />
                  <meshStandardMaterial color={leaf} roughness={0.78} />
                </mesh>
                {xs.map((x) =>
                  zs.map((z) => <Clump key={`${x}-${z}`} colors={colors} x={side * x} z={z} />),
                )}
              </group>
            ))}
          </group>
        )
      })}
    </group>
  )
}
