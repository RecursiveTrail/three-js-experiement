import {
  GATE_CLEAR_M,
  GATES,
  KING_GAP_M,
  SPAWN_AHEAD_MAX,
  SPAWN_AHEAD_MIN,
  type Lane,
  type ModakKind,
} from './constants'

export type SpawnedModak = {
  kind: ModakKind
  lane: Lane
  high: boolean
  atDistance: number
}

const TRIPLE_STAGGER = 1.5
const ROW_GAP = 2
const MAX_TRIES = 8
const PATTERN_COUNT = 4

function randomLane(rng: () => number): Lane {
  const lanes: Lane[] = [-1, 0, 1]
  return lanes[Math.min(2, Math.floor(rng() * 3))]!
}

export function overlapsGate(atDistance: number): boolean {
  return GATES.some((g) => Math.abs(g.distance - atDistance) < GATE_CLEAR_M)
}

function inWindow(atDistance: number, distance: number): boolean {
  const ahead = atDistance - distance
  return ahead >= SPAWN_AHEAD_MIN && ahead <= SPAWN_AHEAD_MAX
}

function baseAt(distance: number, span: number, rng: () => number): number {
  const lo = distance + SPAWN_AHEAD_MIN
  const hi = distance + SPAWN_AHEAD_MAX - span
  if (hi <= lo) return lo
  return lo + rng() * (hi - lo)
}

function buildPattern(
  kind: number,
  distance: number,
  lastKingAt: number,
  rng: () => number,
): SpawnedModak[] {
  if (kind === 0) {
    const lane = randomLane(rng)
    return [{ kind: 'ukadiche', lane, high: false, atDistance: baseAt(distance, 0, rng) }]
  }
  if (kind === 1) {
    const at = baseAt(distance, TRIPLE_STAGGER * 2, rng)
    const lanes: Lane[] = [-1, 0, 1]
    return lanes.map((lane, i) => ({
      kind: 'ukadiche' as const,
      lane,
      high: false,
      atDistance: at + i * TRIPLE_STAGGER,
    }))
  }
  if (kind === 2) {
    const lane = randomLane(rng)
    const at = baseAt(distance, ROW_GAP, rng)
    return [
      { kind: 'ukadiche', lane, high: false, atDistance: at },
      { kind: 'talniche', lane, high: false, atDistance: at + ROW_GAP },
    ]
  }
  const lane = randomLane(rng)
  const at = baseAt(distance, 0, rng)
  const wantKing = rng() < 0.25
  const useKing = wantKing && at - lastKingAt >= KING_GAP_M
  return [{ kind: useKing ? 'king' : 'talniche', lane, high: true, atDistance: at }]
}

export function spawnNext(distance: number, lastKingAt: number, rng: () => number): SpawnedModak[] {
  for (let i = 0; i < MAX_TRIES; i++) {
    const kind = Math.min(PATTERN_COUNT - 1, Math.floor(rng() * PATTERN_COUNT))
    const items = buildPattern(kind, distance, lastKingAt, rng)
    if (items.length > 0 && items.every((m) => inWindow(m.atDistance, distance) && !overlapsGate(m.atDistance))) {
      return items
    }
  }
  return []
}
