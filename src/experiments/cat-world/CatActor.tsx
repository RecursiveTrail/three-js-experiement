import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import type { Group } from 'three'
import { LoopOnce, LoopRepeat } from 'three'
import { assetUrl } from '../../shared/assetUrl'
import type { LogicalAction } from './actions'
import { bindingFor } from './clipMap'
import {
  clampToYard,
  destinationFor,
  figureEight,
  JUMP_DURATION_S,
  STEP_DURATION_S,
  yawFromFacing,
  type MoveMode,
  type Vec3,
} from './idleLife'

export const CAT_SCALE: [number, number, number] = [0.28, 0.26, 0.38]
export const CAT_YAW_OFFSET = 0
export const CAT_URL = assetUrl('assets/cat-world/cat.glb')

export function PlaceholderCat({
  action,
  onActionEnd,
}: {
  action: LogicalAction
  onActionEnd: () => void
}) {
  useEffect(() => {
    const t = window.setTimeout(onActionEnd, 800)
    return () => window.clearTimeout(t)
  }, [action, onActionEnd])
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
  seq,
  facing,
  moveMode,
  onActionEnd,
  positionRef,
}: {
  action: LogicalAction
  seq: number
  facing: Vec3
  moveMode: MoveMode
  onActionEnd: () => void
  positionRef: MutableRefObject<[number, number, number]>
}) {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(CAT_URL)
  const { actions, mixer } = useAnimations(animations, group)
  const binding = bindingFor(action)
  const startRef = useRef<Vec3>([0, 0, 0])
  const destRef = useRef<Vec3>([0, 0, 0])
  const elapsedRef = useRef(0)
  const tRef = useRef(0)

  useEffect(() => {
    scene.traverse((o) => {
      o.castShadow = true
      if (/head/i.test(o.name)) o.scale.setScalar(0.85)
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
  }, [action, seq, actions, binding, mixer, onActionEnd])

  useEffect(() => {
    const from = positionRef.current
    startRef.current = from
    destRef.current = destinationFor(action, moveMode, facing, from)
    elapsedRef.current = 0
  }, [action, seq, facing, moveMode, positionRef])

  useFrame((_, dt) => {
    if (!group.current) return
    group.current.rotation.y = yawFromFacing(facing, CAT_YAW_OFFSET)

    if (moveMode === 'wander' && (action === 'walk' || action === 'trot')) {
      tRef.current += dt * (action === 'trot' ? 1.1 : 0.6)
      const [x, z] = figureEight(tRef.current, 1.8)
      const [cx, cz] = clampToYard(x, z)
      positionRef.current = [cx, 0, cz]
      group.current.position.set(cx, 0, cz)
      return
    }

    if (moveMode === 'step' && (action === 'walk' || action === 'jump' || action === 'pounce')) {
      const duration = action === 'walk' ? STEP_DURATION_S : JUMP_DURATION_S
      elapsedRef.current += dt
      const t = Math.min(1, elapsedRef.current / duration)
      const [sx, sy, sz] = startRef.current
      const [dx, dy, dz] = destRef.current
      const x = sx + (dx - sx) * t
      const y = sy + (dy - sy) * t
      const z = sz + (dz - sz) * t
      positionRef.current = [x, y, z]
      group.current.position.set(x, y, z)
      return
    }

    const [px, py, pz] = positionRef.current
    group.current.position.set(px, py, pz)
  })

  return (
    <group ref={group} scale={CAT_SCALE} position={positionRef.current}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(CAT_URL)
