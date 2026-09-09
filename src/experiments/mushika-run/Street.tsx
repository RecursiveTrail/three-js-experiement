import { worldZ } from './constants'

const TILE_LEN = 8
const TILE_COUNT = 8
const ROAD = '#2a1c28'
const MARIGOLD = '#e8a317'
const RANGOLI = '#c4452d'
const LEAF = '#3d6b2f'
const SAFFRON = '#ef6c00'

function Tile({ variant }: { variant: number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[5.2, TILE_LEN]} />
        <meshStandardMaterial color={ROAD} roughness={0.9} />
      </mesh>
      {[-2.35, 2.35].map((x) => (
        <mesh key={x} position={[x, 0.04, 0]}>
          <boxGeometry args={[0.18, 0.08, TILE_LEN]} />
          <meshStandardMaterial color={variant % 2 === 0 ? MARIGOLD : LEAF} />
        </mesh>
      ))}
      {variant === 1 ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[1.1, TILE_LEN * 0.7]} />
          <meshStandardMaterial color={RANGOLI} />
        </mesh>
      ) : null}
      {variant === 2
        ? [-1.3, 0, 1.3].map((x) => (
            <mesh key={x} position={[x, 1.6, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#ffe9a0" emissive="#ffd27a" emissiveIntensity={1.4} />
            </mesh>
          ))
        : null}
      {variant === 3 ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.6, 0.25]} />
          <meshStandardMaterial color={SAFFRON} />
        </mesh>
      ) : null}
    </group>
  )
}

export function Street({ distance }: { distance: number }) {
  const start = Math.floor(distance / TILE_LEN) - 1
  const tiles = Array.from({ length: TILE_COUNT }, (_, i) => start + i)
  return (
    <group>
      {tiles.map((i) => (
        <group key={i} position={[0, 0, worldZ(i * TILE_LEN + TILE_LEN / 2, distance)]}>
          <Tile variant={((i % 4) + 4) % 4} />
        </group>
      ))}
      <ambientLight intensity={0.35} />
      <pointLight position={[-1.4, 3.2, 2]} intensity={12} color="#ffd9a0" distance={16} />
      <pointLight position={[1.6, 2.8, -4]} intensity={8} color="#ffcc88" distance={14} />
    </group>
  )
}
