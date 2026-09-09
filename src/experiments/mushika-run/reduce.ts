import {
  COLLECT_RADIUS,
  DESPAWN_BEHIND,
  GATE_POINTS,
  GATES,
  HIGH_JUMP_MAX,
  HIGH_JUMP_MIN,
  JUMP_S,
  MODAK,
  SPAWN_AHEAD_MAX,
  SPAWN_AHEAD_MIN,
  SPEED,
  drainPerSecond,
  type GateId,
  type Lane,
  type ModakKind,
} from './constants'
import { spawnNext, type SpawnedModak } from './spawn'

export type Cue = 'nibble' | 'bell' | 'rumble' | null

export type Modak = {
  id: number
  kind: ModakKind
  lane: Lane
  high: boolean
  atDistance: number
}

export type Snapshot = {
  phase: 'playing' | 'over'
  lane: Lane
  jumpT: number | null
  hunger: number
  score: number
  distance: number
  gatesReached: GateId[]
  modaks: Modak[]
  seq: number
  cue: Cue
  nextModakId: number
  lastKingAt: number
}

export type Event =
  | { type: 'tick'; dt: number }
  | { type: 'laneLeft' }
  | { type: 'laneRight' }
  | { type: 'jump' }
  | { type: 'restart' }

export function initialSnapshot(): Snapshot {
  return {
    phase: 'playing',
    lane: 0,
    jumpT: null,
    hunger: 1,
    score: 0,
    distance: 0,
    gatesReached: [],
    modaks: [],
    seq: 0,
    cue: null,
    nextModakId: 1,
    lastKingAt: Number.NEGATIVE_INFINITY,
  }
}

function clampLane(n: number): Lane {
  if (n < -1) return -1
  if (n > 1) return 1
  return n as Lane
}

function canCollect(s: Snapshot, m: Modak): boolean {
  if (m.lane !== s.lane) return false
  if (Math.abs(m.atDistance - s.distance) > COLLECT_RADIUS) return false
  if (m.high) {
    return s.jumpT !== null && s.jumpT >= HIGH_JUMP_MIN && s.jumpT <= HIGH_JUMP_MAX
  }
  return true
}

function applySpawn(s: Snapshot, spawned: SpawnedModak[]): Snapshot {
  if (spawned.length === 0) return s
  let id = s.nextModakId
  let lastKingAt = s.lastKingAt
  const added: Modak[] = spawned.map((p) => {
    if (p.kind === 'king') lastKingAt = p.atDistance
    return { id: id++, ...p }
  })
  return { ...s, modaks: [...s.modaks, ...added], nextModakId: id, lastKingAt }
}

function tickPlaying(s: Snapshot, dt: number, rng: () => number): Snapshot {
  let jumpT = s.jumpT
  if (jumpT !== null) {
    jumpT += dt / JUMP_S
    if (jumpT >= 1) jumpT = null
  }

  let next: Snapshot = {
    ...s,
    distance: s.distance + SPEED * dt,
    jumpT,
    cue: null,
  }

  const kept: Modak[] = []
  let collected = false
  let hunger = next.hunger
  let score = next.score
  let nextModakId = next.nextModakId
  for (const m of next.modaks) {
    if (canCollect(next, m)) {
      hunger = Math.min(1, hunger + MODAK[m.kind].hunger)
      score += MODAK[m.kind].points
      collected = true
      nextModakId = Math.max(nextModakId, m.id + 1)
    } else {
      kept.push(m)
    }
  }
  next = { ...next, modaks: kept, hunger, score, nextModakId }
  if (collected) {
    next = { ...next, seq: next.seq + 1, cue: 'nibble' }
  }

  let gatesReached = next.gatesReached
  let gated = false
  for (const g of GATES) {
    if (next.distance >= g.distance && !gatesReached.includes(g.id)) {
      gatesReached = [...gatesReached, g.id]
      score += GATE_POINTS
      gated = true
    }
  }
  if (gated) {
    next = { ...next, gatesReached, score, seq: next.seq + 1, cue: 'bell' }
  }

  hunger = Math.max(0, next.hunger - drainPerSecond(next.gatesReached.length) * dt)
  next = { ...next, hunger }

  const live = next.modaks.filter((m) => m.atDistance - next.distance >= DESPAWN_BEHIND)
  next = { ...next, modaks: live }
  const windowBusy = live.some((m) => {
    const ahead = m.atDistance - next.distance
    return ahead >= SPAWN_AHEAD_MIN && ahead <= SPAWN_AHEAD_MAX
  })
  if (!windowBusy) {
    next = applySpawn(next, spawnNext(next.distance, next.lastKingAt, rng))
  }

  if (next.hunger <= 0) {
    return { ...next, hunger: 0, phase: 'over', jumpT: null, seq: next.seq + 1, cue: 'rumble' }
  }
  return next
}

export function reduce(state: Snapshot, event: Event, rng: () => number = Math.random): Snapshot {
  if (event.type === 'restart') return initialSnapshot()
  if (state.phase === 'over') {
    if (event.type === 'jump') return initialSnapshot()
    return state
  }
  if (event.type === 'laneLeft') return { ...state, lane: clampLane(state.lane - 1) }
  if (event.type === 'laneRight') return { ...state, lane: clampLane(state.lane + 1) }
  if (event.type === 'jump') {
    if (state.jumpT !== null) return state
    return { ...state, jumpT: 0 }
  }
  return tickPlaying(state, event.dt, rng)
}
