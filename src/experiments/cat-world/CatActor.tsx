import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import type { Group } from 'three'
import { LoopOnce, LoopRepeat } from 'three'
import type { LogicalAction } from './actions'
import { bindingFor } from './clipMap'
import { clampToYard, figureEight } from './idleLife'

export const CAT_SCALE = 0.3
export const CAT_URL = '/assets/cat-world/cat.glb'

export function PlaceholderCat({
  onActionEnd,
}: {
  action: LogicalAction
  onActionEnd: () => void
}) {
  useEffect(() => {
    const t = window.setTimeout(onActionEnd, 800)
    return () => window.clearTimeout(t)
  }, [onActionEnd])
  return (
    <group>
      <mesh castShadow position={[0, 0.18, 0]}>
        <capsuleGeometry args={[0.12, 0.28, 6, 12]} />
        <meshStandardMaterial color="#c46a2d" />
      </mesh>
      <mesh position={[-0.07, 0.4, 0.04]}>
        <coneGeometry args={[0.05, 0.08, 6]} />
        <meshStandardMaterial color="#c46a2d" />
      </mesh>
      <mesh position={[0.07, 0.4, 0.04]}>
        <coneGeometry args={[0.05, 0.08, 6]} />
        <meshStandardMaterial color="#c46a2d" />
      </mesh>
    </group>
  )
}

export function RiggedCat({
  action,
  onActionEnd,
  positionRef,
}: {
  action: LogicalAction
  onActionEnd: () => void
  positionRef: MutableRefObject<[number, number, number]>
}) {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(CAT_URL)
  const { actions, mixer } = useAnimations(animations, group)
  const binding = bindingFor(action)

  useEffect(() => {
    scene.traverse((o) => {
      o.castShadow = true
    })
  }, [scene])

  useEffect(() => {
    const clipName: string = actions[binding.clip] ? binding.clip : 'Idle'
    if (clipName === 'Death' || clipName === 'Jump_Loop') return
    const next = actions[clipName] ?? actions['Idle']
    if (!next) {
      onActionEnd()
      return
    }
    Object.values(actions).forEach((a) => a?.fadeOut(0.15))
    next.reset()
    next.setLoop(binding.loop ? LoopRepeat : LoopOnce, binding.loop ? Infinity : 1)
    next.clampWhenFinished = !binding.loop
    next.fadeIn(0.15).play()
    if (binding.loop) return
    const done = () => onActionEnd()
    mixer.addEventListener('finished', done)
    return () => mixer.removeEventListener('finished', done)
  }, [action, actions, binding, mixer, onActionEnd])

  const tRef = useRef(0)
  useFrame((_, dt) => {
    if (action !== 'walk' && action !== 'trot') return
    tRef.current += dt * (action === 'trot' ? 1.1 : 0.6)
    const [x, z] = figureEight(tRef.current, 1.8)
    const [cx, cz] = clampToYard(x, z)
    positionRef.current = [cx, 0, cz]
    if (group.current) group.current.position.set(cx, 0, cz)
  })

  return (
    <group
      ref={group}
      scale={CAT_SCALE}
      position={positionRef.current}
    >
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(CAT_URL)
