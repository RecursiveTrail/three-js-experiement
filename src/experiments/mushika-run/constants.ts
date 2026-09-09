export type Lane = -1 | 0 | 1
export type ModakKind = 'ukadiche' | 'talniche' | 'king'
export type GateId =
  | 'siddhivinayak'
  | 'andhericha-raja'
  | 'dagadusheth'
  | 'kasba-ganpati'
  | 'lalbaugcha-raja'

export const SPEED = 10
export const DRAIN_PER_SECOND = 0.1
export const DRAIN_GATE_MULT = 1.15
export const DRAIN_GATE_CAP = 5
export const JUMP_S = 0.45
export const JUMP_HEIGHT = 0.7
export const LANE_SPACING = 1.3
export const COLLECT_RADIUS = 0.7
export const HIGH_JUMP_MIN = 0.3
export const HIGH_JUMP_MAX = 0.7
export const LANE_LERP_S = 0.12
export const HINT_S = 3
export const HINT_DISTANCE = HINT_S * SPEED
export const TOAST_MS = 1200
export const GATE_POINTS = 100
export const GATE_CLEAR_M = 5
export const SPAWN_AHEAD_MIN = 20
export const SPAWN_AHEAD_MAX = 40
export const DESPAWN_BEHIND = -4
export const KING_GAP_M = 80
export const DT_CAP = 0.05

export const CAMERA_POS: [number, number, number] = [0, 2.4, 6.2]
export const CAMERA_FOV = 50
export const CAMERA_FOV_PORTRAIT = 58
export const LOOK_AT: [number, number, number] = [0, 0.6, 0]
export const DPR: [number, number] = [1, 2]

export const MODAK: Record<ModakKind, { hunger: number; points: number }> = {
  ukadiche: { hunger: 0.22, points: 10 },
  talniche: { hunger: 0.4, points: 25 },
  king: { hunger: 0.7, points: 50 },
}

export const GATES: readonly { id: GateId; name: string; distance: number }[] = [
  { id: 'siddhivinayak', name: 'Siddhivinayak', distance: 80 },
  { id: 'andhericha-raja', name: 'Andhericha Raja', distance: 180 },
  { id: 'dagadusheth', name: 'Dagadusheth Halwai', distance: 300 },
  { id: 'kasba-ganpati', name: 'Kasba Ganpati', distance: 440 },
  { id: 'lalbaugcha-raja', name: 'Lalbaugcha Raja', distance: 600 },
]

export function drainPerSecond(gateCount: number): number {
  const n = Math.min(Math.max(gateCount, 0), DRAIN_GATE_CAP)
  return DRAIN_PER_SECOND * DRAIN_GATE_MULT ** n
}

export function nextGateLine(distance: number): string {
  const next = GATES.find((g) => distance < g.distance)
  if (!next) return 'beyond Lalbaugcha Raja'
  const remaining = Math.max(0, Math.ceil(next.distance - distance))
  return `${next.name} · ${remaining}m`
}

export function lastGateLabel(gatesReached: readonly GateId[]): string {
  const id = gatesReached[gatesReached.length - 1]
  if (!id) return 'none'
  return GATES.find((g) => g.id === id)?.name ?? 'none'
}

export function jumpY(jumpT: number | null): number {
  if (jumpT === null) return 0
  return JUMP_HEIGHT * Math.sin(Math.PI * jumpT)
}

export function worldZ(atDistance: number, distance: number): number {
  return distance - atDistance
}

export function laneX(lane: Lane): number {
  return lane * LANE_SPACING
}
