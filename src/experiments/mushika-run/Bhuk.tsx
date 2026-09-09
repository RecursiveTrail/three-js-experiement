import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { bhukPose } from './constants'

export function Bhuk({ hunger, over }: { hunger: number; over: boolean }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const h = over ? 0 : hunger
    const { z, scale } = bhukPose(h)
    g.position.set(0, 0.4 + Math.sin(clock.elapsedTime * 6) * 0.05 * (1 - h), z)
    g.scale.setScalar(scale)
  })
  const h = over ? 0 : hunger
  const { z, scale } = bhukPose(h)
  const opacity = 0.12 + (1 - h) * 0.55
  return (
    <group ref={ref} position={[0, 0.4, z]} scale={scale}>
      <mesh scale={[1.6, 0.7, 0.5]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial color="#2a0810" transparent opacity={opacity} roughness={1} />
      </mesh>
      <mesh position={[0, -0.05, 0.35]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[0.35, 0.08, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#4a1020" transparent opacity={opacity + 0.1} />
      </mesh>
    </group>
  )
}
