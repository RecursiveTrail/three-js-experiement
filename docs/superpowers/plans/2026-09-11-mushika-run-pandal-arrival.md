# Mushika Run Pandal Arrival Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Mushika Run’s roadside photo boards and on-street spin-hop with stage-wise flowers, closed gates that open, and a 4 s muted pandal video (still fallback) with namaste, then resume past the open gate.

**Architecture:** `reduce` owns `phase: 'playing' | 'opening' | 'shrine' | 'over'` and the `openingT` / `shrineT` clocks. One `useFrame` still ticks the reducer. Street/Bhuk/modaks/gates unmount during `shrine`. An HTML `<video>` (or `<img>`, or dark fill) sits behind a transparent canvas; the same 3D Mushika namastes. `input.ts` stays mapped to `jump`; reduce treats jump as skip in `shrine`, ignore in `opening`, restart in `over`.

**Tech Stack:** React 19, Vite, TypeScript, `three`, `@react-three/fiber`, `@react-three/drei`, Vitest. No new packages.

**Spec:** `docs/superpowers/specs/2026-09-11-mushika-run-pandal-arrival-design.md`

## Global Constraints

- Portrait-first. Cat World and Dahi Handi stay unchanged.
- Same five gate ids, names, and distances. No sixth gate, Ashtavinayak, or Ganesh Lok.
- No video soundtrack, BGM, YouTube, or remote media URLs.
- No 3D photoreal temple interiors, mouse GLB, Mixamo, Rapier, crash obstacles, slide, double-jump, or `localStorage`.
- Delete `celebrateT` / the on-street spin-hop. Do not keep both blessing styles.
- One `useFrame` → `reduce`. No second rAF. Do not remount `ExperienceCanvas` on shrine.
- Mushika Run always passes `alpha: true` on `ExperienceCanvas`. Other experiments omit `alpha`.
- Missing/failed `{id}.mp4` → `{id}.jpg`; missing jpg → `#1a0c10`. Reducer never waits on media.
- Tab hide / leave `/mushika-run`: pause shrine `<video>`, `stopAll` audio, skip ticks (no background drain).
- Tap/Space skips shrine only. Opening (0.8 s) cannot be skipped.
- Do not commit `output/lalbaugcha-raja-cinematic-9x16.mp4`, macOS `._*` files, or `.vscode/settings.json`.
- Push/fetch/pull: HTTPS + one-shot `gh` credential helper only (never `git push origin` over SSH).

## File structure

```
src/shared/r3f/ExperienceCanvas.tsx              # optional alpha (default false)
src/shared/r3f/ExperienceCanvas.test.ts
src/experiments/mushika-run/constants.ts         # clocks, flowerPalette, shrine URLs, doorOpenT
src/experiments/mushika-run/constants.test.ts
src/experiments/mushika-run/reduce.ts            # opening / shrine; delete celebrateT
src/experiments/mushika-run/reduce.test.ts
src/experiments/mushika-run/Gate.tsx             # closed doors; angle from doorOpenT
src/experiments/mushika-run/FlowersAlongRoad.tsx # create; procedural clumps
src/experiments/mushika-run/GanpatiAlongRoad.tsx # delete
src/experiments/mushika-run/Street.tsx           # mount flowers, not photo boards
src/experiments/mushika-run/Mushika.tsx          # namaste in shrine; lerp X to 0
src/experiments/mushika-run/MushikaRun.tsx       # unmount street on shrine; bust camera; alpha
src/experiments/mushika-run/Overlays.tsx         # ShrineBackdrop + HUD; no toast
src/experiments/mushika-run/Overlays.test.ts
src/experiments/mushika-run/index.tsx            # backdrop under canvas
src/experiments/mushika-run/useMushikaRun.ts     # unchanged audio hide; no second player
src/experiments/mushika-run/input.ts             # unchanged mapping
learningNotes/mushika-run.md
public/assets/mushika-run/shrines/{id}.mp4|.jpg  # already on disk (Lalbaug stand-in)
public/assets/mushika-run/ATTRIBUTION.md         # already notes shrine stand-in
```

**Do not modify:** `input.ts` (except if a test needs a comment), Cat World, Dahi Handi, spawn rules other than existing 5 m gate-clear.

**World space (unchanged):** mouse at origin; `worldZ = distance - atDistance`; ahead is −Z.

**Tick order while `playing`:** distance += 10×dt → collect → first new gate (clamp `distance` to threshold, `phase = 'opening'`) → drain → spawn. While `opening` / `shrine`: no distance, drain, spawn, collect, or lane.

---

### Task 1: Constants — clocks, flowers, shrine URLs, door helper

**Files:**
- Modify: `src/experiments/mushika-run/constants.ts`
- Test: `src/experiments/mushika-run/constants.test.ts`

**Interfaces:**
- Consumes: existing `GATES`, `GateId`, `assetUrl`
- Produces: `GATE_OPEN_S = 0.8`, `SHRINE_S = 4`, `PASS_M = 2.5`, `SHRINE_CAMERA_POS = [0, 1.15, 2.6]`, `SHRINE_LOOK_AT = [0, 0.7, 0]`, `SHRINE_FALLBACK_FILL = '#1a0c10'`, `FLOWER_SIDE_X = 3.2`, `FLOWER_GATE_CLEAR = 10`, `flowerPalette(distance)`, `nearFlowerGate(atDistance)`, `liveGateId(gatesReached)`, `resumeDistance(gatesReached)`, `hudGateLine(phase, distance, gatesReached)`, `doorOpenT(...)`, `shrineVideoUrl(id)`, `shrineStillUrl(id)`, `type Phase`, `type FlowerStretch`. Keep `celebrateY` until Task 2 so `Mushika.tsx` still compiles.

- [ ] **Step 1: Write the failing tests**

Replace the `celebrateY` block later; for this task **add** these describes at the bottom of `constants.test.ts` (keep `celebrateY` tests until Task 2):

```ts
import { assetUrl } from '../../shared/assetUrl'
import {
  // existing imports, plus:
  PASS_M,
  doorOpenT,
  flowerPalette,
  hudGateLine,
  liveGateId,
  nearFlowerGate,
  resumeDistance,
  shrineStillUrl,
  shrineVideoUrl,
} from './constants'

describe('flowerPalette', () => {
  it('uses marigold then jasmine then mixed festival', () => {
    expect(flowerPalette(0).stretch).toBe('marigold')
    expect(flowerPalette(79.9).stretch).toBe('marigold')
    expect(flowerPalette(80).stretch).toBe('jasmine')
    expect(flowerPalette(81).stretch).toBe('jasmine')
    expect(flowerPalette(180).stretch).toBe('hibiscus')
    expect(flowerPalette(300).stretch).toBe('lotus')
    expect(flowerPalette(440).stretch).toBe('rose')
    expect(flowerPalette(600).stretch).toBe('mixed')
    expect(flowerPalette(601).stretch).toBe('mixed')
  })

  it('includes the locked hex colors', () => {
    expect(flowerPalette(0).colors).toEqual(['#ffc53d', '#ff8a1a', '#5ea04a'])
    expect(flowerPalette(81).colors[0]).toBe('#f4f0d8')
  })
})

describe('nearFlowerGate', () => {
  it('clears 10 m around each gate distance', () => {
    expect(nearFlowerGate(80)).toBe(true)
    expect(nearFlowerGate(70.1)).toBe(true)
    expect(nearFlowerGate(50)).toBe(false)
  })
})

describe('liveGateId and resumeDistance', () => {
  it('uses the last reached gate', () => {
    expect(liveGateId([])).toBeUndefined()
    expect(liveGateId(['siddhivinayak'])).toBe('siddhivinayak')
    expect(resumeDistance(['siddhivinayak'])).toBeCloseTo(80 + PASS_M)
    expect(resumeDistance(['siddhivinayak', 'andhericha-raja', 'dagadusheth', 'kasba-ganpati', 'lalbaugcha-raja'])).toBeCloseTo(602.5)
  })
})

describe('hudGateLine', () => {
  it('is the name only during opening and shrine', () => {
    expect(hudGateLine('opening', 80, ['siddhivinayak'])).toBe('Siddhivinayak')
    expect(hudGateLine('shrine', 80, ['siddhivinayak'])).toBe('Siddhivinayak')
  })

  it('uses nextGateLine while playing', () => {
    expect(hudGateLine('playing', 0, [])).toBe('Siddhivinayak · 80m')
    expect(hudGateLine('playing', 602.5, ['lalbaugcha-raja'])).toBe('beyond Lalbaugcha Raja')
  })
})

describe('doorOpenT', () => {
  it('is 0 closed, openingT on the live gate, 1 after reached', () => {
    expect(doorOpenT({ id: 'siddhivinayak', reached: false, phase: 'playing', openingT: null, liveId: undefined })).toBe(0)
    expect(doorOpenT({ id: 'siddhivinayak', reached: true, phase: 'opening', openingT: 0.5, liveId: 'siddhivinayak' })).toBeCloseTo(0.5)
    expect(doorOpenT({ id: 'andhericha-raja', reached: false, phase: 'opening', openingT: 0.5, liveId: 'siddhivinayak' })).toBe(0)
    expect(doorOpenT({ id: 'siddhivinayak', reached: true, phase: 'playing', openingT: null, liveId: 'siddhivinayak' })).toBe(1)
  })
})

describe('shrine urls', () => {
  it('points at local shrines/{id} files', () => {
    expect(shrineVideoUrl('lalbaugcha-raja')).toBe(assetUrl('assets/mushika-run/shrines/lalbaugcha-raja.mp4'))
    expect(shrineStillUrl('siddhivinayak')).toBe(assetUrl('assets/mushika-run/shrines/siddhivinayak.jpg'))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/experiments/mushika-run/constants.test.ts`

Expected: FAIL — `flowerPalette is not defined` (or similar named export missing).

- [ ] **Step 3: Write minimal implementation**

In `constants.ts`: add `import { assetUrl } from '../../shared/assetUrl'`.

Remove nothing yet. After `DPR`, add:

```ts
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
```

Keep `CELEBRATE_S`, `CELEBRATE_HEIGHT`, and `celebrateY` for this task.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/experiments/mushika-run/constants.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/experiments/mushika-run/constants.ts src/experiments/mushika-run/constants.test.ts
git commit -m "$(cat <<'EOF'
Add Mushika shrine clocks and flower palette helpers.

EOF
)"
```

---

### Task 2: Reduce — opening and shrine phases

**Files:**
- Modify: `src/experiments/mushika-run/reduce.ts`
- Modify: `src/experiments/mushika-run/reduce.test.ts`
- Modify: `src/experiments/mushika-run/Mushika.tsx` (compile fix only: stop reading `celebrateT`)
- Modify: `src/experiments/mushika-run/constants.ts` (delete `CELEBRATE_S`, `CELEBRATE_HEIGHT`, `celebrateY`)
- Modify: `src/experiments/mushika-run/constants.test.ts` (delete celebrateY tests)

**Interfaces:**
- Consumes: `GATE_OPEN_S`, `SHRINE_S`, `resumeDistance` from Task 1
- Produces: `Snapshot.phase: Phase`, `openingT: number | null`, `shrineT: number | null`, no `celebrateT`. `jump` during `shrine` calls resume (`distance = resumeDistance(gatesReached)`). `jump` during `opening` is a no-op.

- [ ] **Step 1: Write the failing tests**

Replace the entire `describe('gates')` in `reduce.test.ts` with:

```ts
describe('gates', () => {
  it('awards Siddhivinayak once at 80 m and starts opening', () => {
    const hit = reduce(playing({ distance: 79, hunger: 0.8 }), { type: 'tick', dt: 0.2 }, quiet)
    expect(hit.phase).toBe('opening')
    expect(hit.openingT).toBe(0)
    expect(hit.shrineT).toBeNull()
    expect(hit.distance).toBe(80)
    expect(hit.gatesReached).toEqual(['siddhivinayak'])
    expect(hit.score).toBe(100)
    expect(hit.cue).toBe('bell')
    expect(hit.jumpT).toBeNull()
    const later = reduce(hit, { type: 'tick', dt: 1 }, quiet)
    expect(later.gatesReached).toEqual(['siddhivinayak'])
    expect(later.hunger).toBeCloseTo(0.8)
    expect(later.distance).toBe(80)
    expect(later.phase).toBe('shrine')
    expect(later.shrineT).toBe(0)
    expect(later.openingT).toBeNull()
  })

  it('does not collect, drain, jump, or change lane during opening', () => {
    const opened = playing({
      phase: 'opening',
      openingT: 0.2,
      lane: 0,
      hunger: 0.5,
      distance: 80,
      score: 100,
      gatesReached: ['siddhivinayak'],
      modaks: [{ id: 1, kind: 'king', lane: 0, high: false, atDistance: 80 }],
    })
    const next = reduce(opened, { type: 'tick', dt: 0 }, quiet)
    expect(next.modaks.some((m) => m.id === 1)).toBe(true)
    expect(next.score).toBe(100)
    expect(next.hunger).toBe(0.5)
    expect(reduce(next, { type: 'jump' }, quiet).jumpT).toBeNull()
    expect(reduce(next, { type: 'jump' }, quiet).phase).toBe('opening')
    expect(reduce(next, { type: 'laneRight' }, quiet).lane).toBe(0)
  })

  it('skips shrine on jump and resumes at 82.5 m without restarting', () => {
    const shrine = playing({
      phase: 'shrine',
      shrineT: 0.2,
      hunger: 0.8,
      score: 100,
      distance: 80,
      gatesReached: ['siddhivinayak'],
    })
    const skipped = reduce(shrine, { type: 'jump' }, quiet)
    expect(skipped.phase).toBe('playing')
    expect(skipped.distance).toBeCloseTo(82.5)
    expect(skipped.score).toBe(100)
    expect(skipped.hunger).toBeCloseTo(0.8)
    expect(skipped.openingT).toBeNull()
    expect(skipped.shrineT).toBeNull()
    const drained = reduce(skipped, { type: 'tick', dt: 1 }, quiet)
    expect(drained.hunger).toBeCloseTo(0.8 - 0.1 * 1.15)
  })

  it('auto-resumes after 4 s of shrine', () => {
    const end = reduce(
      playing({ phase: 'shrine', shrineT: 0.9, hunger: 0.8, distance: 80, gatesReached: ['siddhivinayak'] }),
      { type: 'tick', dt: 0.5 },
      quiet,
    )
    expect(end.phase).toBe('playing')
    expect(end.distance).toBeCloseTo(82.5)
  })

  it('fifth-gate resume is beyond Lalbaugcha Raja', () => {
    const ids = ['siddhivinayak', 'andhericha-raja', 'dagadusheth', 'kasba-ganpati', 'lalbaugcha-raja'] as const
    const done = reduce(
      playing({ phase: 'shrine', shrineT: 1, hunger: 0.5, gatesReached: [...ids], distance: 600 }),
      { type: 'jump' },
      quiet,
    )
    expect(done.distance).toBeCloseTo(602.5)
    expect(nextGateLine(done.distance)).toBe('beyond Lalbaugcha Raja')
  })
})
```

Add to the `nextGateLine` import from `./constants` at the top of `reduce.test.ts`.

In `describe('restart')`, keep the over+jump test. Add:

```ts
it('does not restart from shrine via jump', () => {
  const shrine = playing({
    phase: 'shrine',
    shrineT: 0,
    score: 40,
    distance: 80,
    gatesReached: ['siddhivinayak'],
  })
  expect(reduce(shrine, { type: 'jump' }, quiet).score).toBe(40)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/experiments/mushika-run/reduce.test.ts`

Expected: FAIL — `phase` is still `'playing'` after 80 m, or `celebrateT` / missing `openingT`.

- [ ] **Step 3: Write minimal implementation**

`Snapshot` and `initialSnapshot`:

```ts
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
```

Replace `tickPlaying` + `reduce` with:

```ts
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
    if (canCollect(next, m, false)) {
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
```

Keep `canCollect` / `applySpawn` / `clampLane`. Change `canCollect` freeze arg: callers pass `false` while playing (opening/shrine never collect because they never enter `tickPlaying`).

In `Mushika.tsx`, replace celebrate usage so TypeScript builds:

```ts
import { LANE_LERP_S, jumpY, laneX } from './constants'
```

In `useFrame`, delete `celebrating`. Use:

```ts
const blessing = world.phase === 'opening' || world.phase === 'shrine'
const hopping = world.jumpT !== null
const running = world.phase === 'playing' && !hopping
```

Pose: if `blessing`, y = 0, no spin (`rotation` 0, scale 1), no stride. (Namaste comes in Task 6.)

Delete `CELEBRATE_S`, `CELEBRATE_HEIGHT`, `celebrateY` from `constants.ts`. Delete the `hops twice during a gate dance` test and the `celebrateY` import. Rename describe to `'jumpY and worldZ'`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/experiments/mushika-run/reduce.test.ts src/experiments/mushika-run/constants.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/experiments/mushika-run/reduce.ts src/experiments/mushika-run/reduce.test.ts src/experiments/mushika-run/Mushika.tsx src/experiments/mushika-run/constants.ts src/experiments/mushika-run/constants.test.ts
git commit -m "$(cat <<'EOF'
Replace the gate hop with opening and shrine phases.

EOF
)"
```

---

### Task 3: Optional canvas alpha

**Files:**
- Modify: `src/shared/r3f/ExperienceCanvas.tsx`
- Modify: `src/shared/r3f/ExperienceCanvas.test.ts`

**Interfaces:**
- Consumes: none from Mushika
- Produces: `experienceGl(alpha?: boolean): { antialias: true; alpha: boolean }`. `ExperienceCanvas` takes optional `alpha?: boolean` (default false) and passes `gl={experienceGl(alpha)}`. Cat World / Dahi Handi omit the prop.

- [ ] **Step 1: Write the failing test**

Append to `ExperienceCanvas.test.ts`:

```ts
import { experienceGl } from './ExperienceCanvas'

describe('experienceGl', () => {
  it('defaults to an opaque canvas', () => {
    expect(experienceGl()).toEqual({ antialias: true, alpha: false })
    expect(experienceGl(undefined)).toEqual({ antialias: true, alpha: false })
  })

  it('opts into alpha when true', () => {
    expect(experienceGl(true)).toEqual({ antialias: true, alpha: true })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/shared/r3f/ExperienceCanvas.test.ts`

Expected: FAIL — `experienceGl is not a function`.

- [ ] **Step 3: Write minimal implementation**

Replace `ExperienceCanvas.tsx` with:

```tsx
import { Canvas } from '@react-three/fiber'
import type { ReactNode } from 'react'

export function experienceGl(alpha?: boolean): { antialias: true; alpha: boolean } {
  return { antialias: true, alpha: Boolean(alpha) }
}

export function ExperienceCanvas({
  children,
  camera = { position: [0, 1.1, 4.2], fov: 35 },
  dpr,
  alpha = false,
}: {
  children: ReactNode
  camera?: { position: [number, number, number]; fov: number }
  dpr?: [number, number]
  alpha?: boolean
}) {
  return (
    <Canvas
      camera={camera}
      shadows
      dpr={dpr}
      style={{ width: '100%', height: '100%', display: 'block' }}
      gl={experienceGl(alpha)}
    >
      {children}
    </Canvas>
  )
}
```

Update the comment in the test file: `dpr` and `alpha` are optional; only Mushika Run passes both.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/shared/r3f/ExperienceCanvas.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/r3f/ExperienceCanvas.tsx src/shared/r3f/ExperienceCanvas.test.ts
git commit -m "$(cat <<'EOF'
Allow ExperienceCanvas to clear with alpha for shrine video.

EOF
)"
```

---

### Task 4: Flowers instead of photo boards

**Files:**
- Create: `src/experiments/mushika-run/FlowersAlongRoad.tsx`
- Delete: `src/experiments/mushika-run/GanpatiAlongRoad.tsx`
- Modify: `src/experiments/mushika-run/Street.tsx`
- Test: `src/experiments/mushika-run/constants.test.ts` already covers `nearFlowerGate` / `flowerPalette` (Task 1). No new test file unless `TILE_LEN` moves.

**Interfaces:**
- Consumes: `FLOWER_SIDE_X`, `flowerPalette`, `nearFlowerGate`, `worldZ`, `TILE_LEN = 8` (keep exporting `TILE_LEN` from `FlowersAlongRoad.tsx` so `Street.tsx` does not break)
- Produces: `export const TILE_LEN = 8` and `FlowersAlongRoad({ distance, tiles }: { distance: number; tiles: number[] })`

- [ ] **Step 1: Write the failing test**

`Street.tsx` currently imports `TILE_LEN` from `GanpatiAlongRoad`. After this task that import must come from `FlowersAlongRoad`. Add to `constants.test.ts` (already passing `nearFlowerGate`). No extra test. Create a tiny assertion file is overkill.

Instead add one export test in `constants.test.ts` if missing — already have `nearFlowerGate`. Proceed to implement; run the existing constants tests plus `npx tsc -b --pretty false` after the swap so a leftover `GanpatiAlongRoad` import fails.

- [ ] **Step 2: Confirm the old module is the only TILE_LEN source**

Run: `npx vitest run src/experiments/mushika-run/constants.test.ts`

Expected: PASS (baseline). Then implement so `GanpatiAlongRoad` is gone.

- [ ] **Step 3: Write FlowersAlongRoad and retarget Street**

Create `src/experiments/mushika-run/FlowersAlongRoad.tsx`:

```tsx
import { flowerPalette, FLOWER_SIDE_X, nearFlowerGate, worldZ } from './constants'

export const TILE_LEN = 8

function Clump({ colors, x, z }: { colors: readonly string[]; x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {colors.slice(0, 3).map((c, i) => (
        <mesh key={c + i} position={[(i - 1) * 0.16, 0.12 + (i % 2) * 0.04, (i % 3) * 0.1]}>
          <sphereGeometry args={[0.11 - i * 0.015, 8, 8]} />
          <meshStandardMaterial color={c} roughness={0.55} />
        </mesh>
      ))}
    </group>
  )
}

export function FlowersAlongRoad({ distance, tiles }: { distance: number; tiles: number[] }) {
  const { colors } = flowerPalette(distance)
  return (
    <group>
      {tiles.map((i) => {
        const at = i * TILE_LEN + TILE_LEN / 2
        if (nearFlowerGate(at)) return null
        const side: -1 | 1 = i % 2 === 0 ? -1 : 1
        return (
          <group key={`flowers-${i}`} position={[0, 0, worldZ(at, distance)]}>
            <Clump colors={colors} x={side * FLOWER_SIDE_X} z={-1.8} />
            <Clump colors={colors} x={side * FLOWER_SIDE_X} z={0.2} />
            <Clump colors={colors} x={-side * FLOWER_SIDE_X} z={1.6} />
          </group>
        )
      })}
    </group>
  )
}
```

In `Street.tsx` replace the Ganpati import and mount:

```tsx
import { FlowersAlongRoad, TILE_LEN } from './FlowersAlongRoad'
```

Replace the `Suspense` child with `<FlowersAlongRoad distance={distance} tiles={tiles} />`. Delete `GanpatiAlongRoad.tsx`. Do not load `ganpati/*.jpg`.

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run src/experiments/mushika-run && npx tsc -b --pretty false`

Expected: tests PASS; `tsc` PASS; no `GanpatiAlongRoad` errors.

- [ ] **Step 5: Commit**

```bash
git add src/experiments/mushika-run/FlowersAlongRoad.tsx src/experiments/mushika-run/Street.tsx
git rm src/experiments/mushika-run/GanpatiAlongRoad.tsx
git commit -m "$(cat <<'EOF'
Dress the Mushika curbs with stage-wise flowers.

EOF
)"
```

---

### Task 5: Closed doors that swing open

**Files:**
- Modify: `src/experiments/mushika-run/Gate.tsx`
- Modify: `src/experiments/mushika-run/MushikaRun.tsx` (pass `openingT`, `phase`, `liveId`)

**Interfaces:**
- Consumes: `doorOpenT`, `liveGateId` from Task 1; `world.openingT`, `world.phase`, `world.gatesReached`
- Produces: `Gate` props `{ name, id, atDistance, distance, reached, phase, openingT, liveId }`. Door angle `±(π/2) * doorOpenT(...)`.

- [ ] **Step 1: Write the failing test**

`doorOpenT` already tested. Add a compile-time consumer by updating Gate props; no extra unit test. Use the existing `doorOpenT` tests as the gate. If you want a file-level check, add to `constants.test.ts` (already done). Proceed.

- [ ] **Step 2: Run doorOpenT tests (baseline)**

Run: `npx vitest run src/experiments/mushika-run/constants.test.ts -t doorOpenT`

Expected: PASS

- [ ] **Step 3: Implement doors**

Replace `Gate.tsx` body after the lintel (keep `LintelFontPreload` and `Text`) with two door groups. Full `Gate` function:

```tsx
import { Text } from '@react-three/drei'
import { Suspense } from 'react'
import { assetUrl } from '../../shared/assetUrl'
import { doorOpenT, worldZ, type GateId, type Phase } from './constants'

export const LINTEL_FONT = assetUrl('assets/mushika-run/fonts/inter-latin-400-normal.woff')

export function LintelFontPreload() {
  return (
    <Suspense fallback={null}>
      <Text font={LINTEL_FONT} fontSize={0.01} position={[0, -40, 0]} visible={false}>
        Siddhivinayak
      </Text>
    </Suspense>
  )
}

export function Gate({
  name,
  id,
  atDistance,
  distance,
  reached,
  phase,
  openingT,
  liveId,
}: {
  name: string
  id: GateId
  atDistance: number
  distance: number
  reached: boolean
  phase: Phase
  openingT: number | null
  liveId: GateId | undefined
}) {
  const z = worldZ(atDistance, distance)
  if (z < -28 || z > 10) return null
  const open = doorOpenT({ id, reached, phase, openingT, liveId })
  const fontSize = name.length > 14 ? 0.13 : 0.16
  return (
    <group position={[0, 0, z]}>
      {[-2.15, 2.15].map((x) => (
        <mesh key={x} position={[x, 1.2, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 2.4, 8]} />
          <meshStandardMaterial color="#ff8f2a" />
        </mesh>
      ))}
      <mesh position={[0, 2.35, 0]}>
        <boxGeometry args={[4.6, 0.28, 0.22]} />
        <meshStandardMaterial color="#e24b2c" emissive="#5a1408" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 2.55, 0]} rotation={[0, 0, 0.05]}>
        <torusGeometry args={[0.18, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#e8a317" />
      </mesh>
      <group position={[-2.15, 0, 0]} rotation={[0, -Math.PI / 2 * open, 0]}>
        <mesh position={[1.05, 1.1, 0]}>
          <boxGeometry args={[2.1, 2.15, 0.08]} />
          <meshStandardMaterial color="#7a3a18" />
        </mesh>
      </group>
      <group position={[2.15, 0, 0]} rotation={[0, Math.PI / 2 * open, 0]}>
        <mesh position={[-1.05, 1.1, 0]}>
          <boxGeometry args={[2.1, 2.15, 0.08]} />
          <meshStandardMaterial color="#7a3a18" />
        </mesh>
      </group>
      <Suspense fallback={null}>
        <Text font={LINTEL_FONT} position={[0, 2.35, 0.14]} fontSize={fontSize} color="#3a1208" anchorX="center" anchorY="middle">
          {name}
        </Text>
      </Suspense>
    </group>
  )
}
```

In `MushikaRun.tsx` Gate map, pass:

```tsx
import { liveGateId } from './constants'

// inside the GATES.map:
phase={world.phase}
openingT={world.openingT}
liveId={liveGateId(world.gatesReached)}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b --pretty false && npx vitest run src/experiments/mushika-run/constants.test.ts src/experiments/mushika-run/reduce.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/experiments/mushika-run/Gate.tsx src/experiments/mushika-run/MushikaRun.tsx
git commit -m "$(cat <<'EOF'
Close pandal gates until they open in front of Mushika.

EOF
)"
```

---

### Task 6: Namaste bust shot and shrine unmount

**Files:**
- Modify: `src/experiments/mushika-run/Mushika.tsx`
- Modify: `src/experiments/mushika-run/MushikaRun.tsx`

**Interfaces:**
- Consumes: `SHRINE_CAMERA_POS`, `SHRINE_LOOK_AT`, `LANE_LERP_S`, `laneX`; `world.phase === 'shrine'`
- Produces: During shrine, mesh X lerps to **0**, paws fold to chest, CameraRig uses shrine look-at. Street, gates, modaks, Bhuk, and `<color attach="background">` mount only when `phase !== 'shrine'`. `ExperienceCanvas` gets `alpha`.

- [ ] **Step 1: Write a failing helper test**

Add to `constants.test.ts` is unnecessary. Extract nothing new. Verify current `MushikaRun` still mounts Street during shrine by implementing the unmount and running `tsc`.

Skip a dummy failing test — this task is visual. Run the suite before editing as baseline:

Run: `npx vitest run src/experiments/mushika-run`

Expected: PASS

- [ ] **Step 2: Baseline noted; implement namaste + unmount**

In `Mushika.tsx` `useFrame`:

```ts
const shrine = world.phase === 'shrine'
const opening = world.phase === 'opening'
const hopping = world.jumpT !== null
const running = world.phase === 'playing' && !hopping
const target = shrine ? 0 : laneX(world.lane)
const k = 1 - Math.exp(-dt / LANE_LERP_S)
g.position.x += (target - g.position.x) * k
const t = clock.elapsedTime * RUN
const stride = running ? Math.sin(t) : 0
let y = jumpY(world.jumpT)
if (running) y += Math.abs(Math.sin(t * 2)) * 0.07
if (shrine) y = 0.04 + Math.sin(clock.elapsedTime * 2) * 0.02
g.position.y = y
g.position.z = shrine ? 0.15 : 0
if (shrine) {
  g.rotation.set(0.08, 0, 0)
  g.scale.set(1, 1, 1)
} else {
  g.rotation.x = hopping ? -0.18 : running ? Math.abs(stride) * 0.05 : 0
  g.rotation.y = 0
  g.rotation.z = running ? stride * 0.05 : 0
  g.scale.set(1, hopping ? 1.1 : 1, 1)
}
const namaste = shrine ? 0.95 : 0
if (lf.current) {
  lf.current.rotation.x = namaste ? -0.85 : hopping ? 0.75 : stride * 0.85
  lf.current.rotation.z = namaste ? 0.55 : 0
}
if (rf.current) {
  rf.current.rotation.x = namaste ? -0.85 : hopping ? 0.75 : -stride * 0.85
  rf.current.rotation.z = namaste ? -0.55 : 0
}
if (lb.current) lb.current.rotation.x = hopping ? 0.55 : -stride * 0.75
if (rb.current) rb.current.rotation.x = hopping ? 0.55 : stride * 0.75
```

Reset `lf`/`rf` `rotation.z` to 0 when not shrine (already in the else). `opening` stands still (no run). Unused `opening` is fine for that still pose (running is false).

Replace `MushikaRun.tsx` scene with:

```tsx
import {
  CAMERA_FOV,
  CAMERA_FOV_PORTRAIT,
  CAMERA_POS,
  DPR,
  DT_CAP,
  GATES,
  LOOK_AT,
  SHRINE_CAMERA_POS,
  SHRINE_LOOK_AT,
  liveGateId,
} from './constants'

function CameraRig({ shrine }: { shrine: boolean }) {
  const { camera, size } = useThree()
  useLayoutEffect(() => {
    const look = shrine ? SHRINE_LOOK_AT : LOOK_AT
    camera.position.set(...(shrine ? SHRINE_CAMERA_POS : CAMERA_POS))
    camera.lookAt(...look)
    const portrait = size.height > size.width
    if (camera instanceof PerspectiveCamera) {
      camera.fov = shrine ? 42 : portrait ? CAMERA_FOV_PORTRAIT : CAMERA_FOV
      camera.updateProjectionMatrix()
    }
  }, [camera, size.height, size.width, shrine])
  return null
}

export function MushikaRun({ world, onTick }: { world: Snapshot; onTick: (dt: number) => void }) {
  const shrine = world.phase === 'shrine'
  return (
    <ExperienceCanvas camera={{ position: CAMERA_POS, fov: CAMERA_FOV }} dpr={DPR} alpha>
      {shrine ? null : <color attach="background" args={['#7a3a48']} />}
      <LintelFontPreload />
      <CameraRig shrine={shrine} />
      <Tick onTick={onTick} />
      {shrine ? null : (
        <>
          <Street distance={world.distance} />
          {world.modaks.map((m) => (
            <Modak key={m.id} modak={m} distance={world.distance} />
          ))}
          {GATES.map((g) => (
            <Gate
              key={g.id}
              id={g.id}
              name={g.name}
              atDistance={g.distance}
              distance={world.distance}
              reached={world.gatesReached.includes(g.id)}
              phase={world.phase}
              openingT={world.openingT}
              liveId={liveGateId(world.gatesReached)}
            />
          ))}
          <Bhuk hunger={world.hunger} over={world.phase === 'over'} />
        </>
      )}
      <Mushika world={world} />
      {shrine ? <ambientLight intensity={0.9} /> : null}
      {shrine ? <pointLight position={[0, 1.4, 2.2]} intensity={18} color="#ffe8c4" distance={8} /> : null}
    </ExperienceCanvas>
  )
}
```

Keep existing `Tick` (visibility skip). Do not remount `ExperienceCanvas` when `shrine` flips — same component, `alpha` always true.

- [ ] **Step 3: Typecheck and unit tests**

Run: `npx tsc -b --pretty false && npx vitest run src/experiments/mushika-run src/shared/r3f/ExperienceCanvas.test.ts`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/experiments/mushika-run/Mushika.tsx src/experiments/mushika-run/MushikaRun.tsx
git commit -m "$(cat <<'EOF'
Show a namaste bust shot and hide the street during shrine.

EOF
)"
```

---

### Task 7: Shrine video backdrop and HUD

**Files:**
- Modify: `src/experiments/mushika-run/Overlays.tsx`
- Modify: `src/experiments/mushika-run/Overlays.test.ts`
- Modify: `src/experiments/mushika-run/index.tsx`
- Add (already on disk): `public/assets/mushika-run/shrines/*.mp4` and `*.jpg`
- Modify: `public/assets/mushika-run/ATTRIBUTION.md` if the shrine table is not already there

**Interfaces:**
- Consumes: `shrineVideoUrl`, `shrineStillUrl`, `SHRINE_FALLBACK_FILL`, `hudGateLine`, `liveGateId`, `lastGateLabel`
- Produces: `shrineKind(videoFailed: boolean, stillFailed: boolean): 'video' | 'still' | 'fill'`. `ShrineBackdrop` HTML layer. No `{Name} unlocked` toast.

- [ ] **Step 1: Write the failing tests**

Replace `Overlays.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { shrineKind } from './Overlays'

describe('shrineKind', () => {
  it('prefers video, then still, then fill', () => {
    expect(shrineKind(false, false)).toBe('video')
    expect(shrineKind(true, false)).toBe('still')
    expect(shrineKind(true, true)).toBe('fill')
    expect(shrineKind(false, true)).toBe('video')
  })
})
```

Delete `toastAfterGates` (spec: this beat replaces the toast).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/experiments/mushika-run/Overlays.test.ts`

Expected: FAIL — `shrineKind is not exported`.

- [ ] **Step 3: Implement overlay + stacking**

`Overlays.tsx` (full file):

```tsx
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HINT_DISTANCE,
  SHRINE_FALLBACK_FILL,
  hudGateLine,
  lastGateLabel,
  liveGateId,
  shrineStillUrl,
  shrineVideoUrl,
} from './constants'
import type { Snapshot } from './reduce'

export function shrineKind(videoFailed: boolean, stillFailed: boolean): 'video' | 'still' | 'fill' {
  if (!videoFailed) return 'video'
  if (!stillFailed) return 'still'
  return 'fill'
}

export function ShrineBackdrop({ world }: { world: Snapshot }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const [stillFailed, setStillFailed] = useState(false)
  const id = liveGateId(world.gatesReached)
  const active = world.phase === 'shrine' && id

  useEffect(() => {
    setVideoFailed(false)
    setStillFailed(false)
  }, [id])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const pause = () => {
      v.pause()
    }
    if (!active || document.visibilityState === 'hidden') {
      pause()
      return
    }
    v.muted = true
    void v.play().catch(() => setVideoFailed(true))
    const onVis = () => {
      if (document.visibilityState === 'hidden') pause()
      else if (world.phase === 'shrine') void v.play().catch(() => setVideoFailed(true))
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      pause()
    }
  }, [active, world.phase, id])

  if (!active || !id) return null
  const kind = shrineKind(videoFailed, stillFailed)
  const fill: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    background: SHRINE_FALLBACK_FILL,
    objectFit: 'cover',
    width: '100%',
    height: '100%',
  }
  if (kind === 'fill') return <div style={fill} />
  if (kind === 'still') {
    return (
      <img
        src={shrineStillUrl(id)}
        alt=""
        style={fill}
        onError={() => setStillFailed(true)}
      />
    )
  }
  return (
    <video
      ref={videoRef}
      src={shrineVideoUrl(id)}
      muted
      loop
      playsInline
      autoPlay
      style={fill}
      onError={() => setVideoFailed(true)}
    />
  )
}

export function Overlays({ world }: { world: Snapshot }) {
  const hungerPct = Math.round(world.hunger * 100)
  const showHint = world.phase === 'playing' && world.distance < HINT_DISTANCE
  const gateLine = hudGateLine(world.phase, world.distance, world.gatesReached)
  const shrine = world.phase === 'shrine'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        pointerEvents: 'none',
        color: '#fff8e8',
        fontFamily: 'system-ui, sans-serif',
        textShadow: '0 2px 8px #000',
      }}
    >
      <div
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          paddingLeft: 'max(12px, env(safe-area-inset-left))',
          paddingRight: 'max(12px, env(safe-area-inset-right))',
        }}
      >
        <div style={{ pointerEvents: 'auto', padding: '4px 4px 8px' }}>
          <Link to="/" style={{ color: '#fff' }}>
            All experiments
          </Link>
        </div>
        <div style={{ fontSize: 13, letterSpacing: 0.4, marginBottom: 6 }}>Hunger</div>
        <div
          style={{
            height: 18,
            borderRadius: 9,
            background: '#6a2030',
            overflow: 'hidden',
            border: '1px solid #ffd27a',
          }}
        >
          <div
            style={{
              width: `${hungerPct}%`,
              height: '100%',
              background: world.hunger > 0.35 ? '#ff9a2a' : '#e24b2c',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 18, fontWeight: 700 }}>
          <span>{world.score}</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{gateLine}</span>
        </div>
        {shrine ? (
          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 22, fontWeight: 800 }}>{gateLine}</div>
        ) : null}
        {shrine ? <div style={{ marginTop: 8, textAlign: 'center', fontSize: 15 }}>tap to continue</div> : null}
        {showHint ? <div style={{ marginTop: 10, fontSize: 15 }}>swipe to change lane · swipe up to jump</div> : null}
      </div>

      {world.phase === 'over' ? (
        <div
          style={{
            pointerEvents: 'auto',
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 'max(24px, env(safe-area-inset-bottom))',
            background: 'rgba(20, 8, 14, 0.88)',
            border: '1px solid #f0c070',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800 }}>Bhuk caught you</div>
          <div style={{ marginTop: 8 }}>score {world.score}</div>
          <div>last gate: {lastGateLabel(world.gatesReached)}</div>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            {world.gatesReached.map((gid) => (
              <li key={gid}>{lastGateLabel([gid])}</li>
            ))}
          </ul>
          <div style={{ marginTop: 12, fontWeight: 700 }}>tap or Space — run again</div>
        </div>
      ) : null}
    </div>
  )
}
```

`index.tsx`: import `ShrineBackdrop`. Set root `background` to `#6b303c`. Structure:

```tsx
<ShrineBackdrop world={world} />
<MushikaBoundary fallback={...}>
  <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
    <MushikaRun world={world} onTick={tick} />
  </div>
</MushikaBoundary>
<Overlays world={world} />
```

Do not add a second audio player. `useMushikaRun.ts` hide `stopAll` stays as it is.

Stage shrine binaries (do **not** add `output/lalbaugcha-raja-cinematic-9x16.mp4`).

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/experiments/mushika-run && npx tsc -b --pretty false`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/experiments/mushika-run/Overlays.tsx src/experiments/mushika-run/Overlays.test.ts src/experiments/mushika-run/index.tsx public/assets/mushika-run/shrines public/assets/mushika-run/ATTRIBUTION.md
git commit -m "$(cat <<'EOF'
Play a muted pandal clip behind Mushika at each gate.

EOF
)"
```

---

### Task 8: Learning note

**Files:**
- Modify: `learningNotes/mushika-run.md`

**Interfaces:**
- Consumes: the finished play loop
- Produces: a short note so the next session does not reintroduce `celebrateT` or photo boards

- [ ] **Step 1: Rewrite the note** (no unit test)

Replace `learningNotes/mushika-run.md` with:

```md
# Mushika Run

The mouse stays at the origin. Distance is a number on the snapshot; tiles, modaks, and gates are placed at `worldZ = distance - atDistance` so the street scrolls toward +Z (the camera). Collects and gates use that number, not mesh X.

`useFrame` is the only clock. The reducer ticks inside it. Lane lerp, namaste, and door angle are visual and must not decide collects or phase.

Hunger is the fail condition. Bhuk’s Z/scale are functions of the same `hunger` the HUD bar reads, so they cannot disagree.

`phase` is `playing | opening | shrine | over`. Crossing a gate freezes distance at the threshold, opens doors (0.8 s), then cuts to HTML video behind a transparent canvas (4 s, tap skips). Resume sets `distance = gate.distance + 2.5`. There is no `celebrateT` and no roadside ganpati photos.

Audio copies Dahi Handi’s overlapping player (not Cat World’s one-voice player) because nibble and a late bell must be allowed to overlap. Shrine video is muted; the bell is the blessing sound.
```

- [ ] **Step 2: Commit**

```bash
git add learningNotes/mushika-run.md
git commit -m "$(cat <<'EOF'
Note the shrine freeze so celebrateT is not revived.

EOF
)"
```

- [ ] **Step 3: Full verification**

Run: `npx vitest run && npx tsc -b --pretty false`

Expected: all tests PASS.

Manual (phone or portrait browser at `/mushika-run`): no photo boards; flowers change after a shrine; closed Siddhivinayak opens (~0.8 s), Lalbaug stand-in video + namaste, tap or ~4 s, running again with the open gate behind; starve → game over list; restart; Cat World and Dahi Handi still load.

---

## Self-review (spec coverage)

| Spec item | Task |
|---|---|
| `flowerPalette` six buckets + hex | 1 |
| `GATE_OPEN_S` / `SHRINE_S` / `PASS_M` / shrine camera | 1 |
| Opening freeze, clamp 80 m, bell, skip ignored | 2 |
| Shrine 4 s / jump resume 82.5 / drain 1.15× / fifth gate 602.5 | 2 |
| `over`+jump restarts; shrine+jump does not | 2 |
| `ExperienceCanvas` optional alpha; others omit | 3 |
| Flowers, no `GanpatiAlongRoad`, 10 m gate clear | 4 |
| Closed doors, `doorOpenT`, live gate swing | 5 |
| Namaste, X→0, bust cam, unmount street on shrine | 6 |
| HTML video / jpg / `#1a0c10`, pause on hide, HUD copy, no toast | 7 |
| Shrine files in `public/assets/mushika-run/shrines/` | 7 (already on disk) |
| `learningNotes` | 8 |
| `input.ts` mapping unchanged | 2 (reduce interprets jump) |
| No Ashtavinayak / Ganesh Lok / BGM / remount canvas | Global + 6 |
