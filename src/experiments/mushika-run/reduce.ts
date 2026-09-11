import {
  COLLECT_RADIUS,
  DESPAWN_BEHIND,
  GATE_OPEN_S,
  GATE_POINTS,
  GATES,
  HIGH_JUMP_MAX,
  HIGH_JUMP_MIN,
  JUMP_S,
  MODAK,
  SHRINE_S,
  SPAWN_AHEAD_MAX,
  SPAWN_AHEAD_MIN,
  SPEED,
  drainPerSecond,
  resumeDistance,
  type GateId,
  type Lane,
  type ModakKind,
  type Phase,
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
  phase: Phase
  lane: Lane
  jumpT: number | null
  openingT: number | null
  shrineT: number | null
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
    openingT: null,
    shrineT: null,
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

function resumeFromShrine(s: Snapshot): Snapshot {
  return {
    ...s,
    phase: 'playing',
    openingT: null,
    shrineT: null,
    jumpT: null,
    cue: null,
    distance: resumeDistance(s.gatesReached),
  }
}

function tickFrozen(s: Snapshot, dt: number): Snapshot {
  if (s.phase === 'opening') {
    const openingT = (s.openingT ?? 0) + dt / GATE_OPEN_S
    if (openingT >= 1) return { ...s, phase: 'shrine', openingT: null, shrineT: 0, jumpT: null, cue: null }
    return { ...s, openingT, cue: null }
  }
  if (s.phase === 'shrine') {
    const shrineT = (s.shrineT ?? 0) + dt / SHRINE_S
    if (shrineT >= 1) return resumeFromShrine(s)
    return { ...s, shrineT, cue: null }
  }
  return s
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
  if (collected) next = { ...next, seq: next.seq + 1, cue: 'nibble' }

  const g = GATES.find((gate) => next.distance >= gate.distance && !next.gatesReached.includes(gate.id))
  if (g) {
    return {
      ...next,
      distance: g.distance,
      gatesReached: [...next.gatesReached, g.id],
      score: next.score + GATE_POINTS,
      phase: 'opening',
      openingT: 0,
      shrineT: null,
      jumpT: null,
      seq: next.seq + 1,
      cue: 'bell',
    }
  }

  hunger = Math.max(0, next.hunger - drainPerSecond(next.gatesReached.length) * dt)
  next = { ...next, hunger }

  const live = next.modaks.filter((m) => m.atDistance - next.distance >= DESPAWN_BEHIND)
  next = { ...next, modaks: live }
  const windowBusy = live.some((m) => {
    const ahead = m.atDistance - next.distance
    return ahead >= SPAWN_AHEAD_MIN && ahead <= SPAWN_AHEAD_MAX
  })
  if (!windowBusy) next = applySpawn(next, spawnNext(next.distance, next.lastKingAt, rng))

  if (next.hunger <= 0) {
    return { ...next, hunger: 0, phase: 'over', jumpT: null, openingT: null, shrineT: null, seq: next.seq + 1, cue: 'rumble' }
  }
  return next
}

export function reduce(state: Snapshot, event: Event, rng: () => number = Math.random): Snapshot {
  if (event.type === 'restart') return initialSnapshot()
  if (state.phase === 'over') {
    if (event.type === 'jump') return initialSnapshot()
    return state
  }
  if (event.type === 'laneLeft') {
    if (state.phase !== 'playing') return state
    return { ...state, lane: clampLane(state.lane - 1) }
  }
  if (event.type === 'laneRight') {
    if (state.phase !== 'playing') return state
    return { ...state, lane: clampLane(state.lane + 1) }
  }
  if (event.type === 'jump') {
    if (state.phase === 'shrine') return resumeFromShrine(state)
    if (state.phase === 'opening') return state
    if (state.jumpT !== null) return state
    return { ...state, jumpT: 0 }
  }
  if (state.phase === 'opening' || state.phase === 'shrine') return tickFrozen(state, event.dt)
  return tickPlaying(state, event.dt, rng)
}
