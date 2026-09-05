import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { POT_Y, ROPE_Y } from './constants'
import type { Group } from 'three'

export function Handi({ xz }: { xz: [number, number] }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.4) * 0.06
  })
  return (
    <group position={[xz[0], 0, xz[1]]}>
      <mesh position={[0, (ROPE_Y + POT_Y + 0.18) / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, ROPE_Y - (POT_Y + 0.18), 6]} />
        <meshStandardMaterial color="#5c4030" />
      </mesh>
      <group ref={ref} position={[0, POT_Y, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#e24d12" roughness={0.42} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.1, 12]} />
          <meshStandardMaterial color="#c43d0c" roughness={0.45} />
        </mesh>
      </group>
    </group>
  )
}
