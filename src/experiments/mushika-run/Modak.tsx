import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'
import { laneX, worldZ } from './constants'
import type { Modak as ModakState } from './reduce'

const COLORS = {
  ukadiche: '#f3e6c8',
  talniche: '#e0a020',
  king: '#f7f4ea',
}

export function Modak({ modak, distance }: { modak: ModakState; distance: number }) {
  const spark = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (spark.current) spark.current.rotateY(clock.getDelta() * 4)
  })
  const y = modak.high ? 0.7 : 0.12
  return (
    <group position={[laneX(modak.lane), y, worldZ(modak.atDistance, distance)]}>
      {modak.kind === 'ukadiche' ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
          <circleGeometry args={[0.12, 10]} />
          <meshStandardMaterial color="#3d6b2f" />
        </mesh>
      ) : null}
      <mesh>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color={COLORS[modak.kind]} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.07, 0]} scale={[0.7, 0.45, 0.7]}>
        <sphereGeometry args={[0.07, 10, 12]} />
        <meshStandardMaterial color={COLORS[modak.kind]} roughness={0.5} />
      </mesh>
      {modak.kind === 'king' ? (
        <mesh ref={spark} position={[0.08, 0.12, 0.04]}>
          <octahedronGeometry args={[0.04, 0]} />
          <meshStandardMaterial color="#ffe27a" emissive="#ffe27a" emissiveIntensity={1.6} />
        </mesh>
      ) : null}
    </group>
  )
}
