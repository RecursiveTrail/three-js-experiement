import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { LANE_LERP_S, jumpY, laneX } from './constants'
import type { Snapshot } from './reduce'

const SKIN = '#f4c45a'
const BODY = '#e8b03a'
const GOLD = '#ffd978'
const SASH = '#e24b2c'
const PINK = '#ff9aa8'
const EYE = '#4a2418'
const SHADOW_Y = 0.03

export function Mushika({ world }: { world: Snapshot }) {
  const ref = useRef<Group>(null)
  const shadow = useRef<Group>(null)

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
    const blob = shadow.current
    if (blob) {
      blob.position.x = g.position.x
      blob.position.y = SHADOW_Y
      blob.position.z = 0
    }
  })

  return (
    <>
      <group ref={shadow} position={[0, SHADOW_Y, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.28, 16]} />
          <meshBasicMaterial color="#5a3018" transparent opacity={0.22} />
        </mesh>
      </group>
      <group ref={ref} position={[0, 0, 0]}>
        <mesh position={[0, 0.16, 0.02]} scale={[1, 0.75, 1.35]}>
          <sphereGeometry args={[0.16, 14, 14]} />
          <meshStandardMaterial color={BODY} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.2, 0.02]} rotation={[0.2, 0, 0]}>
          <torusGeometry args={[0.14, 0.025, 8, 16]} />
          <meshStandardMaterial color={SASH} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.38, 0.06]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.48, 0.02]}>
          <cylinderGeometry args={[0.05, 0.09, 0.06, 10]} />
          <meshStandardMaterial color={GOLD} metalness={0.55} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.44, 0.175]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color={SASH} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.12, 0.5, 0.02]} rotation={[0.2, 0, s * -0.4]}>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshStandardMaterial color={SKIN} roughness={0.45} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`in-${s}`} position={[s * 0.12, 0.5, 0.03]} rotation={[0.2, 0, s * -0.4]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={PINK} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`ring-${s}`} position={[s * 0.12, 0.46, 0.04]}>
            <torusGeometry args={[0.028, 0.008, 6, 12]} />
            <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.25} />
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
          <meshStandardMaterial color={GOLD} roughness={0.4} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={`l-${s}`} position={[s * 0.07, 0.06, 0.08]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={BODY} roughness={0.5} />
          </mesh>
        ))}
      </group>
    </>
  )
}
