import { useFrame, useThree } from '@react-three/fiber'
import type { MutableRefObject } from 'react'

export function FollowCamera({
  target,
}: {
  target: MutableRefObject<[number, number, number]>
}) {
  const camera = useThree((s) => s.camera)
  useFrame((_, dt) => {
    const [x, y, z] = target.current
    const desiredX = x
    const desiredY = y + 1.1
    const desiredZ = z + 4.2
    const k = 1 - Math.pow(0.001, dt)
    camera.position.x += (desiredX - camera.position.x) * k
    camera.position.y += (desiredY - camera.position.y) * k
    camera.position.z += (desiredZ - camera.position.z) * k
    camera.lookAt(x, y + 0.3, z)
  })
  return null
}
