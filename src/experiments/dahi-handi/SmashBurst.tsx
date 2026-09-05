import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { BREAK_S, POT_Y, SHARD_COUNT } from './constants'
import type { Group } from 'three'

const OFFSETS: [number, number, number][] = [
  [0.12, 0, 0.05],
  [-0.1, 0.04, 0.08],
  [0.04, -0.02, -0.12],
  [-0.08, 0.02, -0.06],
  [0.09, 0.06, -0.04],
  [0, 0.08, 0.1],
]

export function SmashBurst({ xz, animSeq }: { xz: [number, number]; animSeq: number }) {
  const ref = useRef<Group>(null)
  const started = useRef(0)
  useEffect(() => {
    started.current = performance.now()
  }, [animSeq])
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const u = Math.min(1, (performance.now() - started.current) / (BREAK_S * 1000))
    g.position.y = POT_Y - u * 1.4
    g.rotation.z = u * 0.8
    g.scale.setScalar(1 - u * 0.3)
  })
  return (
    <group ref={ref} position={[xz[0], POT_Y, xz[1]]}>
      {OFFSETS.slice(0, SHARD_COUNT).map((o, i) => (
        <mesh key={i} position={o} castShadow>
          <boxGeometry args={[0.07, 0.05, 0.06]} />
          <meshStandardMaterial color="#c4713b" />
        </mesh>
      ))}
    </group>
  )
}
