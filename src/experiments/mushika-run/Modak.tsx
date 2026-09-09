import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh } from 'three'
import { laneX, worldZ, type ModakKind } from './constants'
import type { Modak as ModakState } from './reduce'

const COLORS: Record<ModakKind, string> = {
  ukadiche: '#f6ead0',
  talniche: '#e8a318',
  king: '#fff6e4',
}

function Dumpling({ kind }: { kind: ModakKind }) {
  const color = COLORS[kind]
  const fried = kind === 'talniche'
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.38, 14]} />
        <meshStandardMaterial color="#4c8c36" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} scale={[0.62, 1, 1]}>
        <circleGeometry args={[0.32, 14]} />
        <meshStandardMaterial color="#2e6428" />
      </mesh>
      <mesh position={[0, 0.16, 0]} scale={[1.22, 0.82, 1.22]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={fried ? 0.3 : 0.48}
          metalness={fried ? 0.18 : 0}
        />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <coneGeometry args={[0.15, 0.26, 8]} />
        <meshStandardMaterial color={color} roughness={fried ? 0.3 : 0.48} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.15, 0.26, Math.sin(a) * 0.15]}
            rotation={[0.7, a, 0]}
          >
            <cylinderGeometry args={[0.03, 0.04, 0.14, 6]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        )
      })}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#e24b2c" />
      </mesh>
    </group>
  )
}

export function Modak({ modak, distance }: { modak: ModakState; distance: number }) {
  const wrap = useRef<Group>(null)
  const spark = useRef<Mesh>(null)
  useFrame((_, dt) => {
    if (wrap.current) wrap.current.rotation.y += dt * 0.7
    spark.current?.rotateY(dt * 4)
  })
  const y = modak.high ? 0.95 : 0.02
  const scale = modak.kind === 'king' ? 1.18 : modak.kind === 'talniche' ? 1.08 : 1
  return (
    <group position={[laneX(modak.lane), y, worldZ(modak.atDistance, distance)]} scale={scale}>
      <group ref={wrap}>
        <Dumpling kind={modak.kind} />
        {modak.kind === 'king' ? (
          <mesh ref={spark} position={[0.2, 0.42, 0.08]}>
            <octahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color="#ffe27a" emissive="#ffe27a" emissiveIntensity={1.8} />
          </mesh>
        ) : null}
      </group>
    </group>
  )
}
