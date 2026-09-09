import { worldZ } from './constants'

const TILE_LEN = 8
const TILE_COUNT = 8
const ROAD = '#e2c49a'
const MARIGOLD = '#ffc53d'
const RANGOLI = '#e85d3a'
const LEAF = '#5ea04a'
const SAFFRON = '#ff8a1a'

function Tile({ variant }: { variant: number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[5.2, TILE_LEN]} />
        <meshStandardMaterial color={ROAD} roughness={0.72} metalness={0.04} />
      </mesh>
      {[-2.35, 2.35].map((x) => (
        <mesh key={x} position={[x, 0.04, 0]}>
          <boxGeometry args={[0.18, 0.08, TILE_LEN]} />
          <meshStandardMaterial color={variant % 2 === 0 ? MARIGOLD : LEAF} />
        </mesh>
      ))}
      {[-2.2, 2.2].flatMap((x) =>
        [-2.6, 0, 2.6].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 1.35, z]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color="#fff4c8" emissive="#ffd27a" emissiveIntensity={2.2} />
          </mesh>
        )),
      )}
      {variant === 1 ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[1.1, TILE_LEN * 0.7]} />
          <meshStandardMaterial color={RANGOLI} />
        </mesh>
      ) : null}
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
      <hemisphereLight args={['#ffe0b8', '#d4a060', 0.9]} />
      <ambientLight intensity={0.62} />
      <pointLight position={[0, 3.6, 3.2]} intensity={22} color="#ffe8c4" distance={24} />
      <pointLight position={[-1.6, 2.8, -1]} intensity={16} color="#ffd090" distance={20} />
      <pointLight position={[1.7, 2.6, -7]} intensity={14} color="#ffc070" distance={20} />
    </group>
  )
}
