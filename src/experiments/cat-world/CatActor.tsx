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
  destinationFor,
  JUMP_DURATION_S,
  settledStepPosition,
  shouldEndFromMixer,
  shouldSettlePreviousStep,
  STEP_DURATION_S,
  wanderPosition,
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
  const wanderOriginRef = useRef<Vec3>([0, 0, 0])
  const elapsedRef = useRef(0)
  const tRef = useRef(0)
  const completedStepRef = useRef<{ seq: number; dest: Vec3 } | null>(null)

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
    Object.values(actions).forEach((a) => a?.stop())
    next.reset()
    next.setLoop(binding.loop ? LoopRepeat : LoopOnce, binding.loop ? Infinity : 1)
    next.clampWhenFinished = !binding.loop
    next.fadeIn(0.15).play()
    if (binding.loop) return
    const done = (event: { action: unknown }) => {
      if (shouldEndFromMixer(moveMode, event.action, next)) onActionEnd()
    }
    mixer.addEventListener('finished', done)
    return () => mixer.removeEventListener('finished', done)
  }, [action, seq, actions, binding, mixer, moveMode, onActionEnd])

  useEffect(() => {
    const prev = completedStepRef.current
    if (prev && shouldSettlePreviousStep(prev.seq, seq)) {
      const [dx, dy, dz] = prev.dest
      positionRef.current = [dx, dy, dz]
      group.current?.position.set(dx, dy, dz)
    }

    const from = positionRef.current
    startRef.current = from
    destRef.current = destinationFor(action, moveMode, facing, from)
    elapsedRef.current = 0

    if (moveMode === 'step') {
      completedStepRef.current = { seq, dest: destRef.current }
    } else {
      completedStepRef.current = null
    }
  }, [action, seq, facing, moveMode, positionRef])

  useEffect(() => {
    if (moveMode !== 'wander' || (action !== 'walk' && action !== 'trot')) return
    wanderOriginRef.current = positionRef.current
    tRef.current = 0
  }, [action, seq, moveMode, positionRef])

  useFrame((_, dt) => {
    if (!group.current) return
    group.current.rotation.y = yawFromFacing(facing, CAT_YAW_OFFSET)

    if (moveMode === 'wander' && (action === 'walk' || action === 'trot')) {
      tRef.current += dt * (action === 'trot' ? 1.1 : 0.6)
      const [x, y, z] = wanderPosition(wanderOriginRef.current, tRef.current, 1.8)
      positionRef.current = [x, y, z]
      group.current.position.set(x, y, z)
      return
    }

    if (moveMode === 'step' && (action === 'walk' || action === 'jump' || action === 'pounce')) {
      const duration = action === 'walk' ? STEP_DURATION_S : JUMP_DURATION_S
      elapsedRef.current += dt
      const [x, y, z] = settledStepPosition(
        startRef.current,
        destRef.current,
        elapsedRef.current,
        duration,
      )
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
