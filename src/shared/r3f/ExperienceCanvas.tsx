import { Canvas } from '@react-three/fiber'
import type { ReactNode } from 'react'

export function ExperienceCanvas({
  children,
  camera = { position: [0, 1.1, 4.2], fov: 35 },
  dpr,
}: {
  children: ReactNode
  camera?: { position: [number, number, number]; fov: number }
  dpr?: [number, number]
}) {
  return (
    <Canvas
      camera={camera}
      shadows
      dpr={dpr}
      style={{ width: '100%', height: '100%', display: 'block' }}
      gl={{ antialias: true }}
    >
      {children}
    </Canvas>
  )
}
