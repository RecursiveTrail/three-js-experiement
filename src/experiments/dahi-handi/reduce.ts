import { BREAK_S, JUMP_S, RUN_MAX_S, RUN_MIN_S, RUN_SPEED, WAIT_S } from './constants'
import { spawnPot, type Xz } from './spawn'

export type Phase = 'idle' | 'run' | 'jump' | 'break' | 'wait'
export type Vec3 = [number, number, number]
export type World = {
  phase: Phase
  krishna: Vec3
  yaw: number
  pot: Xz | null
  potId: number
  lastSmash: Xz | null
  smashCount: number
  queued: boolean
  seq: number
  animSeq: number
}
export type WorldEvent = { type: 'jump' } | { type: 'end' }

export function runDurationS(from: Xz, to: Xz): number {
  const d = Math.hypot(to[0] - from[0], to[1] - from[1])
  return Math.min(RUN_MAX_S, Math.max(RUN_MIN_S, d / RUN_SPEED))
}

export function phaseDurationS(state: World): number | null {
  if (state.phase === 'idle') return null
  if (state.phase === 'run' && state.pot) {
    return runDurationS([state.krishna[0], state.krishna[2]], state.pot)
  }
  if (state.phase === 'jump') return JUMP_S
  if (state.phase === 'break') return BREAK_S
  if (state.phase === 'wait') return WAIT_S
  return null
}

function yawTo(from: Vec3, pot: Xz): number {
  return Math.atan2(pot[0] - from[0], pot[1] - from[2])
}

function startRun(state: World): World {
  if (!state.pot) return { ...state, queued: true }
  return {
    ...state,
    phase: 'run',
    yaw: yawTo(state.krishna, state.pot),
    queued: false,
    animSeq: state.animSeq + 1,
  }
}

export function initialWorld(rng: () => number): World {
  const pot = spawnPot([0, 0], rng)
  return {
    phase: 'idle',
    krishna: [0, 0, 0],
    yaw: yawTo([0, 0, 0], pot),
    pot,
    potId: 1,
    lastSmash: null,
    smashCount: 0,
    queued: false,
    seq: 0,
    animSeq: 0,
  }
}

export function reduce(state: World, event: WorldEvent, rng: () => number): World {
  if (event.type === 'jump') {
    if (state.phase === 'idle' && state.pot) return startRun(state)
    return { ...state, queued: true }
  }

  if (state.phase === 'run' && state.pot) {
    const pot = state.pot
    return {
      ...state,
      phase: 'jump',
      krishna: [pot[0], 0, pot[1]],
      animSeq: state.animSeq + 1,
    }
  }

  if (state.phase === 'jump' && state.pot) {
    return {
      ...state,
      phase: 'break',
      lastSmash: state.pot,
      pot: null,
      smashCount: state.smashCount + 1,
      seq: state.seq + 1,
      animSeq: state.animSeq + 1,
    }
  }

  if (state.phase === 'break') {
    return { ...state, phase: 'wait', animSeq: state.animSeq + 1 }
  }

  if (state.phase === 'wait') {
    const avoid = state.lastSmash ?? [0, 0]
    const pot = spawnPot(avoid, rng)
    const spawned: World = {
      ...state,
      pot,
      potId: state.potId + 1,
      yaw: yawTo(state.krishna, pot),
    }
    if (state.queued) return startRun(spawned)
    return { ...spawned, phase: 'idle', animSeq: state.animSeq + 1 }
  }

  return state
}
