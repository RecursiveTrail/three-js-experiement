import type { LogicalAction } from './actions'

export type Vec3 = [number, number, number]
export type MoveMode = 'step' | 'wander'

export const YARD_HALF = 3.4
export const DEFAULT_FACING: Vec3 = [0, 0, -1]
export const STEP_DISTANCE = 1.2
export const STEP_DURATION_S = 0.8
export const STEP_DURATION_MS = 800
export const JUMP_DISTANCE = 0.5
export const JUMP_DURATION_S = 0.5
export const JUMP_DURATION_MS = 500

export function clampToYard(x: number, z: number): [number, number] {
  return [
    Math.max(-YARD_HALF, Math.min(YARD_HALF, x)),
    Math.max(-YARD_HALF, Math.min(YARD_HALF, z)),
  ]
}

export function figureEight(tSeconds: number, radius: number): [number, number] {
  return [radius * Math.sin(tSeconds), radius * Math.sin(tSeconds) * Math.cos(tSeconds)]
}

export function wanderPosition(origin: Vec3, tSeconds: number, radius: number): Vec3 {
  const [x, z] = figureEight(tSeconds, radius)
  const [cx, cz] = clampToYard(origin[0] + x, origin[2] + z)
  return [cx, origin[1], cz]
}

export function endTimeoutMs(action: LogicalAction, moveMode: MoveMode): number | null {
  if (action === 'walk' && moveMode === 'step') return STEP_DURATION_MS
  if (action === 'jump' && moveMode === 'step') return JUMP_DURATION_MS
  if (action === 'walk' || action === 'eat') return 4000
  return null
}

export function shouldEndFromMixer<T>(
  moveMode: MoveMode,
  finishedAction: T,
  startedAction: T,
): boolean {
  return moveMode !== 'step' && finishedAction === startedAction
}

export function translateClamped(position: Vec3, dir: Vec3, distance: number): Vec3 {
  const [cx, cz] = clampToYard(position[0] + dir[0] * distance, position[2] + dir[2] * distance)
  return [cx, position[1], cz]
}

export function destinationFor(
  action: LogicalAction,
  moveMode: MoveMode,
  facing: Vec3,
  from: Vec3,
): Vec3 {
  if (moveMode !== 'step') return from
  if (action === 'walk') return translateClamped(from, facing, STEP_DISTANCE)
  if (action === 'jump' || action === 'pounce') return translateClamped(from, facing, JUMP_DISTANCE)
  return from
}

export function settledStepPosition(
  start: Vec3,
  dest: Vec3,
  elapsed: number,
  duration: number,
): Vec3 {
  if (elapsed >= duration) return dest
  const t = elapsed / duration
  return [
    start[0] + (dest[0] - start[0]) * t,
    start[1] + (dest[1] - start[1]) * t,
    start[2] + (dest[2] - start[2]) * t,
  ]
}

export function shouldSettlePreviousStep(prevSeq: number | null, nextSeq: number): boolean {
  return prevSeq !== null && prevSeq !== nextSeq
}

export function yawFromFacing(facing: Vec3, offset = 0): number {
  return Math.atan2(facing[0], facing[2]) + offset
}
