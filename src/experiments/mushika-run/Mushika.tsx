import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { LANE_LERP_S, jumpY, laneX } from './constants'
import type { Snapshot } from './reduce'

const FUR = '#8a5a3c'
const DARK = '#4a2e22'
const PINK = '#e8a090'
const EYE = '#1a120c'

export function Mushika({ world }: { world: Snapshot }) {
  const ref = useRef<Group>(null)

  useFrame(({ clock }, dt) => {
    const g = ref.current
    if (!g) return
    const target = laneX(world.lane)
    const k = 1 - Math.exp(-dt / LANE_LERP_S)
    g.position.x += (target - g.position.x) * k
    let y = jumpY(world.jumpT)
    if (world.jumpT === null && world.phase === 'playing') {
      y += Math.abs(Math.sin(clock.elapsedTime * 14)) * 0.04
    }
    g.position.y = y
    g.position.z = 0
    const stretch = world.jumpT !== null ? 1.12 : 1
    g.scale.set(1, stretch, 1)
  })

  return (
    <group ref={ref} position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.28, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, 0.16, 0.02]} scale={[1, 0.75, 1.35]}>
        <sphereGeometry args={[0.16, 14, 14]} />
        <meshStandardMaterial color={FUR} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.38, 0.06]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={FUR} roughness={0.65} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.12, 0.5, 0.02]} rotation={[0.2, 0, s * -0.4]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color={FUR} roughness={0.7} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`in-${s}`} position={[s * 0.12, 0.5, 0.03]} rotation={[0.2, 0, s * -0.4]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={PINK} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`e-${s}`} position={[s * 0.05, 0.4, 0.16]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color={EYE} />
        </mesh>
      ))}
      <mesh position={[0, 0.36, 0.18]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={PINK} />
      </mesh>
      <mesh position={[0, 0.18, -0.22]} rotation={[1.1, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.02, 0.38, 6]} />
        <meshStandardMaterial color={DARK} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`l-${s}`} position={[s * 0.07, 0.06, 0.08]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
      ))}
    </group>
  )
}
