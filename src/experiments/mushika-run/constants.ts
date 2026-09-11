import { assetUrl } from '../../shared/assetUrl'

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
export const CELEBRATE_S = 1.8
export const CELEBRATE_HEIGHT = 1.05
export const LANE_SPACING = 1.3
export const COLLECT_RADIUS = 0.7
export const HIGH_JUMP_MIN = 0.3
export const HIGH_JUMP_MAX = 0.7
export const LANE_LERP_S = 0.12
export const HINT_S = 3
export const HINT_DISTANCE = HINT_S * SPEED
export const TOAST_MS = 1800
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

export const GATE_OPEN_S = 0.8
export const SHRINE_S = 4
export const PASS_M = 2.5
export const SHRINE_CAMERA_POS: [number, number, number] = [0, 1.15, 2.6]
export const SHRINE_LOOK_AT: [number, number, number] = [0, 0.7, 0]
export const SHRINE_FALLBACK_FILL = '#1a0c10'
export const FLOWER_SIDE_X = 3.2
export const FLOWER_GATE_CLEAR = 10

export type Phase = 'playing' | 'opening' | 'shrine' | 'over'
export type FlowerStretch = 'marigold' | 'jasmine' | 'hibiscus' | 'lotus' | 'rose' | 'mixed'

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

export function flowerPalette(distance: number): { stretch: FlowerStretch; colors: readonly string[] } {
  if (distance < 80) return { stretch: 'marigold', colors: ['#ffc53d', '#ff8a1a', '#5ea04a'] }
  if (distance < 180) return { stretch: 'jasmine', colors: ['#f4f0d8', '#fff4c8', '#6b8f4e'] }
  if (distance < 300) return { stretch: 'hibiscus', colors: ['#d22b3a', '#e85d3a', '#e8a317'] }
  if (distance < 440) return { stretch: 'lotus', colors: ['#f2a0b8', '#fff8ee'] }
  if (distance < 600) return { stretch: 'rose', colors: ['#b81e48', '#ffc53d'] }
  return {
    stretch: 'mixed',
    colors: ['#ffc53d', '#ff8a1a', '#5ea04a', '#f4f0d8', '#fff4c8', '#6b8f4e', '#d22b3a', '#e85d3a', '#e8a317', '#f2a0b8', '#fff8ee', '#b81e48'],
  }
}

export function nearFlowerGate(atDistance: number): boolean {
  return GATES.some((g) => Math.abs(g.distance - atDistance) < FLOWER_GATE_CLEAR)
}

export function liveGateId(gatesReached: readonly GateId[]): GateId | undefined {
  return gatesReached[gatesReached.length - 1]
}

export function resumeDistance(gatesReached: readonly GateId[]): number {
  const id = liveGateId(gatesReached)
  const g = GATES.find((x) => x.id === id)
  return g ? g.distance + PASS_M : 0
}

export function hudGateLine(phase: Phase, distance: number, gatesReached: readonly GateId[]): string {
  if (phase === 'opening' || phase === 'shrine') {
    const name = lastGateLabel(gatesReached)
    return name === 'none' ? '' : name
  }
  return nextGateLine(distance)
}

export function doorOpenT(args: {
  id: GateId
  reached: boolean
  phase: Phase
  openingT: number | null
  liveId: GateId | undefined
}): number {
  if (args.phase === 'opening' && args.id === args.liveId) return args.openingT ?? 0
  return args.reached ? 1 : 0
}

export function shrineVideoUrl(id: GateId): string {
  return assetUrl(`assets/mushika-run/shrines/${id}.mp4`)
}

export function shrineStillUrl(id: GateId): string {
  return assetUrl(`assets/mushika-run/shrines/${id}.jpg`)
}

export function jumpY(jumpT: number | null): number {
  if (jumpT === null) return 0
  return JUMP_HEIGHT * Math.sin(Math.PI * jumpT)
}

/** Two hops during a pandal blessing (0..1). */
export function celebrateY(celebrateT: number | null): number {
  if (celebrateT === null) return 0
  return CELEBRATE_HEIGHT * Math.abs(Math.sin(Math.PI * 2 * celebrateT))
}

export function worldZ(atDistance: number, distance: number): number {
  return distance - atDistance
}

export function laneX(lane: Lane): number {
  return lane * LANE_SPACING
}

/** Visual distance of Bhuk: 1 ≈ off-screen, 0.2 ≈ bottom third, 0 ≈ swallows the mouse. */
export function bhukPose(hunger: number): { z: number; scale: number } {
  const h = Math.min(1, Math.max(0, hunger))
  const keys = [
    { h: 0, z: 0.45, scale: 4.2 },
    { h: 0.2, z: 4.9, scale: 1.55 },
    { h: 0.5, z: 5.7, scale: 1.05 },
    { h: 1, z: 5.95, scale: 0.9 },
  ] as const
  const hi = keys.findIndex((k) => k.h >= h)
  const b = keys[hi === -1 ? keys.length - 1 : hi]!
  const a = keys[Math.max(0, hi - 1)]!
  if (a.h === b.h) return { z: b.z, scale: b.scale }
  const t = (h - a.h) / (b.h - a.h)
  return { z: a.z + (b.z - a.z) * t, scale: a.scale + (b.scale - a.scale) * t }
}
