import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { APEX_Y } from './constants'
import { phaseDurationS, type World } from './reduce'
import type { Group } from 'three'

export function Krishna({ world }: { world: World }) {
  const ref = useRef<Group>(null)
  const started = useRef(performance.now())
  const lastAnimSeq = useRef(world.animSeq)
  if (lastAnimSeq.current !== world.animSeq) {
    lastAnimSeq.current = world.animSeq
    started.current = performance.now()
  }

  useFrame(() => {
    const g = ref.current
    if (!g) return
    const duration = phaseDurationS(world)
    const u = duration ? Math.min(1, (performance.now() - started.current) / (duration * 1000)) : 0
    let x = world.krishna[0]
    let y = 0
    let z = world.krishna[2]
    if (world.phase === 'run' && world.pot) {
      x = world.krishna[0] + (world.pot[0] - world.krishna[0]) * u
      z = world.krishna[2] + (world.pot[1] - world.krishna[2]) * u
      y = Math.abs(Math.sin(u * Math.PI * 4)) * 0.06
    } else if (world.phase === 'jump') {
      y = APEX_Y * Math.sin((Math.PI / 2) * u)
    } else if (world.phase === 'break') {
      y = APEX_Y * (1 - u)
    }
    g.position.set(x, y, z)
    g.rotation.y = world.yaw
    const stretch = world.phase === 'jump' ? 1.08 : 1
    g.scale.set(1, stretch, 1)
  })

  return (
    <group ref={ref} position={world.krishna} rotation={[0, world.yaw, 0]} castShadow>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.28, 10]} />
        <meshStandardMaterial color="#3d6bb3" />
      </mesh>
      <mesh position={[0, 0.08, 0.02]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.2, 0.28, 10]} />
        <meshStandardMaterial color="#e4c441" />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#3d6bb3" />
      </mesh>
      <mesh position={[0, 0.64, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#1a120c" />
      </mesh>
      <mesh position={[0.02, 0.78, -0.02]} rotation={[0.4, 0.2, 0.3]}>
        <coneGeometry args={[0.03, 0.22, 6]} />
        <meshStandardMaterial color="#2f8f4e" />
      </mesh>
      <mesh position={[0, 0.38, -0.12]} rotation={[1.2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.28, 8]} />
        <meshStandardMaterial color="#b08948" />
      </mesh>
    </group>
  )
}
