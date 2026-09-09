# Mushika Run Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new `/mushika-run` portrait 3-lane endless runner where procedural Mushika auto-runs a festive street, eats three kinds of modak, passes five named Mumbai pandal gates, and fails only when Hunger (Bhuk) catches her.

**Architecture:** Pure `reduce` owns the snapshot (lane, jump, hunger, score, distance, gates, modaks). `spawnNext` fills a 20–40 m window from a seeded pattern list. One R3F `useFrame` calls `tick(dt)`; the mouse mesh only lerps visible X. Touch swipe/tap is primary input; keyboard is a desktop fallback. Experiment-local overlapping one-shots (nibble / bell / rumble). No Rapier, no GLB, no `localStorage`. Cat World and Dahi Handi stay untouched.

**Tech Stack:** React 19, Vite, TypeScript, `three`, `@react-three/fiber`, `@react-three/drei` (already in the app), `react-router-dom`, Vitest. No new packages.

**Spec:** `docs/superpowers/specs/2026-09-09-mushika-run-design.md`

## Global Constraints

- This experiment is portrait-first. Cat World and Dahi Handi stay desktop-leaning and unchanged.
- No Rapier / colliders / miss-the-obstacle timing.
- No slide, double-jump, or analog stick overlay.
- No mouse GLB, Mixamo, or photoreal temple interiors.
- No persistent achievements, accounts, or `localStorage`.
- No landscape-first layout, virtual on-screen buttons, or changes to Cat World / Dahi Handi input.
- No background music loop.
- Do not replace shader-pond on the GPU ladder.
- Do not change shared Canvas defaults except optional camera + `dpr` passed by this page.
- Do not reuse Cat World’s `createAudioPlayer` (one-voice, typed to cat `SoundName`). Copy the Dahi Handi overlapping-player pattern instead.
- Hunger meter hits 0 is the only fail. No crash obstacles.
- Missing mp3: skip that shot, still collect / gate / catch visually.
- Tab away from `/mushika-run`: stop listening, `stopAll` audio, freeze the snapshot (do not drain hunger in the background).
- Key-held auto-repeat is ignored. Swipe-down and unknown keys do nothing.
- Do not commit macOS `._*` AppleDouble files.
- Push/fetch/pull: HTTPS + one-shot `gh` credential helper only (never `git push origin` over SSH).

## File structure

```
src/app/experiments.ts                          # add mushika-run entry
src/app/experiments.test.ts                     # assert /mushika-run
src/app/App.tsx                                 # Route
src/shared/r3f/ExperienceCanvas.tsx            # optional dpr
src/experiments/mushika-run/constants.ts       # drain, fills, points, lanes, gates, copy helpers
src/experiments/mushika-run/constants.test.ts
src/experiments/mushika-run/spawn.ts            # next collectible pattern
src/experiments/mushika-run/spawn.test.ts
src/experiments/mushika-run/reduce.ts           # pure snapshot machine
src/experiments/mushika-run/reduce.test.ts
src/experiments/mushika-run/input.ts            # swipe / tap / keyboard → commands
src/experiments/mushika-run/input.test.ts
src/experiments/mushika-run/audio.ts            # overlapping named one-shots
src/experiments/mushika-run/audio.test.ts
src/experiments/mushika-run/MushikaBoundary.tsx
src/experiments/mushika-run/Street.tsx          # recycled tiles from distance
src/experiments/mushika-run/Mushika.tsx         # mesh; pose from lane lerp + jump clock
src/experiments/mushika-run/Modak.tsx
src/experiments/mushika-run/Gate.tsx
src/experiments/mushika-run/Bhuk.tsx
src/experiments/mushika-run/MushikaRun.tsx     # Canvas scene + useFrame tick
src/experiments/mushika-run/Overlays.tsx
src/experiments/mushika-run/useMushikaRun.ts
src/experiments/mushika-run/index.tsx
public/assets/mushika-run/audio/nibble.mp3
public/assets/mushika-run/audio/bell.mp3
public/assets/mushika-run/audio/rumble.mp3
public/assets/mushika-run/ATTRIBUTION.md
README.md
learningNotes/mushika-run.md
docs/roadmap/README.md                         # off-ladder note only; shader-pond stays Next
```

**World space (locked):** mouse feet stay near the origin. Ahead is **−Z**. A collectible at `atDistance` sits at `worldZ = distance - atDistance`. Camera starts at `(0, 2.4, 6.2)` looking at `(0, 0.6, 0)`. Lane X is `lane * 1.3`. Jump Y is `0.7 * sin(π * jumpT)`.

**Snapshot extras vs spec:** `cue` (`'nibble' | 'bell' | 'rumble' | null`) so the hook knows which one-shot to play; `nextModakId` and `lastKingAt` for spawn bookkeeping. HUD hint uses `distance < 30` (3 s × 10 m/s) so it freezes when the tab is hidden.

**Tick order:** advance distance + jumpT → collect → gates → drain → despawn/fill → if `hunger <= 0` then `over` + rumble. Collect before drain so a same-frame nibble can save the run.

**One clock:** `MushikaRun` `useFrame` dispatches `{ type: 'tick', dt }`. There is no `setTimeout` phase timer. Child `useFrame` (lane lerp, bob, sparkle) is the same R3F loop, not a second `requestAnimationFrame`.

---

### Task 1: Register `/mushika-run`

**Files:**
- Modify: `src/app/experiments.ts`
- Modify: `src/app/experiments.test.ts`
- Modify: `src/app/App.tsx`
- Create: `src/experiments/mushika-run/index.tsx`

**Interfaces:**
- Consumes: existing `Experiment` type and `ExperimentList` (reads `experiments`).
- Produces: `experiments` includes `{ id: 'mushika-run', title: 'Mushika Run', path: '/mushika-run', description: 'Ganpati’s mouse runs three festive lanes. Eat modaks before Hunger catches you.' }`. Route `/mushika-run` renders `MushikaRunPage`.

- [ ] **Step 1: Write the failing registry test**

Add this case to `src/app/experiments.test.ts` (keep Cat World and Dahi Handi):

```ts
import { describe, expect, it } from 'vitest'
import { experiments } from './experiments'

describe('experiments', () => {
  it('lists Cat World at /cat-world', () => {
    expect(experiments.some((e) => e.id === 'cat-world' && e.path === '/cat-world')).toBe(true)
  })

  it('lists Dahi Handi at /dahi-handi', () => {
    expect(experiments.some((e) => e.id === 'dahi-handi' && e.path === '/dahi-handi')).toBe(true)
  })

  it('lists Mushika Run at /mushika-run', () => {
    expect(experiments.some((e) => e.id === 'mushika-run' && e.path === '/mushika-run')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/experiments.test.ts`

Expected: FAIL, `lists Mushika Run at /mushika-run` because the array has only Cat World and Dahi Handi.

- [ ] **Step 3: Register the experiment and stub page**

`src/app/experiments.ts` — add the third entry (do not remove the others):

```ts
export type Experiment = {
  id: string
  title: string
  path: string
  description: string
}

export const experiments: readonly Experiment[] = [
  {
    id: 'cat-world',
    title: 'Cat World',
    path: '/cat-world',
    description: 'A backyard cat that reacts when you mash the keyboard.',
  },
  {
    id: 'dahi-handi',
    title: 'Dahi Handi',
    path: '/dahi-handi',
    description: 'Little Krishna jumps to smash hanging dahi handis.',
  },
  {
    id: 'mushika-run',
    title: 'Mushika Run',
    path: '/mushika-run',
    description: 'Ganpati’s mouse runs three festive lanes. Eat modaks before Hunger catches you.',
  },
]
```

Create `src/experiments/mushika-run/index.tsx`:

```tsx
export function MushikaRunPage() {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        background: '#1a1020',
        color: '#f4e6c1',
        padding: 24,
      }}
    >
      Mushika Run
    </div>
  )
}
```

`src/app/App.tsx`:

```tsx
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ExperimentList } from './ExperimentList'
import { CatWorldPage } from '../experiments/cat-world/index'
import { DahiHandiPage } from '../experiments/dahi-handi/index'
import { MushikaRunPage } from '../experiments/mushika-run/index'

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<ExperimentList />} />
        <Route path="/cat-world" element={<CatWorldPage />} />
        <Route path="/dahi-handi" element={<DahiHandiPage />} />
        <Route path="/mushika-run" element={<MushikaRunPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/experiments.test.ts`

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/experiments.ts src/app/experiments.test.ts src/app/App.tsx src/experiments/mushika-run/index.tsx
git commit -m "$(cat <<'EOF'
feat: register Mushika Run experiment route

EOF
)"
```

---

### Task 2: Constants, drain, HUD copy

**Files:**
- Create: `src/experiments/mushika-run/constants.ts`
- Test: `src/experiments/mushika-run/constants.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Lane`, `ModakKind`, `GateId`, `GATES`, `MODAK`, `drainPerSecond(gateCount)`, `nextGateLine(distance)`, `lastGateLabel(gatesReached)`, `jumpY(jumpT)`, `worldZ(atDistance, distance)`, `laneX(lane)`.

- [ ] **Step 1: Write the failing tests**

Create `src/experiments/mushika-run/constants.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  DRAIN_PER_SECOND,
  GATES,
  drainPerSecond,
  jumpY,
  lastGateLabel,
  nextGateLine,
  worldZ,
} from './constants'

describe('drainPerSecond', () => {
  it('is 0.10/s with 0 gates', () => {
    expect(drainPerSecond(0)).toBeCloseTo(0.1)
  })

  it('multiplies by 1.15 after 1 gate', () => {
    expect(drainPerSecond(1)).toBeCloseTo(0.1 * 1.15)
  })

  it('caps at the fifth-gate rate', () => {
    expect(drainPerSecond(5)).toBeCloseTo(DRAIN_PER_SECOND * 1.15 ** 5)
    expect(drainPerSecond(6)).toBeCloseTo(drainPerSecond(5))
  })
})

describe('nextGateLine', () => {
  it('shows the first gate with remaining metres', () => {
    expect(nextGateLine(0)).toBe('Siddhivinayak · 80m')
    expect(nextGateLine(79.2)).toBe('Siddhivinayak · 1m')
  })

  it('uses beyond copy after Lalbaugcha Raja', () => {
    expect(nextGateLine(600)).toBe('beyond Lalbaugcha Raja')
    expect(nextGateLine(900)).toBe('beyond Lalbaugcha Raja')
  })
})

describe('lastGateLabel', () => {
  it('is none before any gate', () => {
    expect(lastGateLabel([])).toBe('none')
  })

  it('uses the last reached name', () => {
    expect(lastGateLabel(['siddhivinayak', 'andhericha-raja'])).toBe('Andhericha Raja')
  })
})

describe('jumpY and worldZ', () => {
  it('is 0 on the ground and ~0.7 at apex', () => {
    expect(jumpY(null)).toBe(0)
    expect(jumpY(0)).toBeCloseTo(0)
    expect(jumpY(0.5)).toBeCloseTo(0.7)
    expect(jumpY(1)).toBeCloseTo(0)
  })

  it('places ahead in -Z', () => {
    expect(worldZ(20, 0)).toBeCloseTo(-20)
    expect(worldZ(80, 80)).toBeCloseTo(0)
  })
})

describe('GATES', () => {
  it('has five named thresholds', () => {
    expect(GATES.map((g) => [g.id, g.distance])).toEqual([
      ['siddhivinayak', 80],
      ['andhericha-raja', 180],
      ['dagadusheth', 300],
      ['kasba-ganpati', 440],
      ['lalbaugcha-raja', 600],
    ])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/experiments/mushika-run/constants.test.ts`

Expected: FAIL with `Failed to resolve import './constants'`.

- [ ] **Step 3: Write constants**

Create `src/experiments/mushika-run/constants.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/experiments/mushika-run/constants.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/experiments/mushika-run/constants.ts src/experiments/mushika-run/constants.test.ts
git commit -m "$(cat <<'EOF'
feat: add Mushika Run constants and HUD copy helpers

EOF
)"
```

---

### Task 3: Seeded spawn patterns

**Files:**
- Create: `src/experiments/mushika-run/spawn.ts`
- Test: `src/experiments/mushika-run/spawn.test.ts`

**Interfaces:**
- Consumes: `GATES`, `GATE_CLEAR_M`, `KING_GAP_M`, `SPAWN_AHEAD_MIN`, `SPAWN_AHEAD_MAX`, `Lane`, `ModakKind`.
- Produces: `SpawnedModak`, `overlapsGate(atDistance)`, `spawnNext(distance, lastKingAt, rng): SpawnedModak[]`.

`spawnNext` picks from four patterns (rng `floor(u * 4)`):

0. single `ukadiche`, random lane, ground
1. three `ukadiche`, lanes −1 / 0 / 1, z staggered by 1.5 m
2. same-lane pair: `ukadiche` then `talniche` 2 m later
3. high `talniche` or high `king` (king only if `atDistance - lastKingAt >= 80`, else high talniche); `rng() < 0.25` asks for king

If any candidate is outside `[distance+20, distance+40]` or within 5 m of a gate distance, skip and try another pattern. After 8 failures return `[]`.

- [ ] **Step 1: Write the failing tests**

Create `src/experiments/mushika-run/spawn.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { GATES, KING_GAP_M, SPAWN_AHEAD_MAX, SPAWN_AHEAD_MIN } from './constants'
import { overlapsGate, spawnNext } from './spawn'

function seqRng(values: number[]) {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]!
}

function inWindow(at: number, distance: number) {
  const ahead = at - distance
  return ahead >= SPAWN_AHEAD_MIN && ahead <= SPAWN_AHEAD_MAX
}

describe('overlapsGate', () => {
  it('rejects placements within 5 m of a gate', () => {
    expect(overlapsGate(80)).toBe(true)
    expect(overlapsGate(84.9)).toBe(true)
    expect(overlapsGate(75)).toBe(false)
    expect(overlapsGate(85)).toBe(false)
  })
})

describe('spawnNext', () => {
  it('places a single ukadiche in the 20–40 m window', () => {
    const rng = seqRng([0, 0.5, 0])
    const items = spawnNext(0, -KING_GAP_M, rng)
    expect(items).toHaveLength(1)
    expect(items[0]!.kind).toBe('ukadiche')
    expect(items[0]!.high).toBe(false)
    expect(items[0]!.lane).toBe(0)
    expect(inWindow(items[0]!.atDistance, 0)).toBe(true)
    expect(overlapsGate(items[0]!.atDistance)).toBe(false)
  })

  it('staggers three ukadiche across all lanes', () => {
    const rng = seqRng([0.3, 0])
    const items = spawnNext(0, -KING_GAP_M, rng)
    expect(items).toHaveLength(3)
    expect(items.map((m) => m.lane)).toEqual([-1, 0, 1])
    expect(items[1]!.atDistance - items[0]!.atDistance).toBeCloseTo(1.5)
    expect(items[2]!.atDistance - items[1]!.atDistance).toBeCloseTo(1.5)
    for (const m of items) {
      expect(inWindow(m.atDistance, 0)).toBe(true)
      expect(overlapsGate(m.atDistance)).toBe(false)
    }
  })

  it('keeps every placement ≥ 5 m from every gate', () => {
    const rng = seqRng([0, 0, 0.5, 0.25, 0.9, 0.1, 0.4, 0.7, 0.2, 0.8])
    const items = spawnNext(55, -KING_GAP_M, rng)
    for (const m of items) {
      expect(inWindow(m.atDistance, 55)).toBe(true)
      for (const g of GATES) {
        expect(Math.abs(m.atDistance - g.distance)).toBeGreaterThanOrEqual(5)
      }
    }
  })

  it('does not spawn a second king inside 80 m', () => {
    const rng = seqRng([0.9, 0.5, 0, 0])
    const items = spawnNext(0, 10, rng)
    expect(items).toHaveLength(1)
    expect(items[0]!.high).toBe(true)
    expect(items[0]!.kind).toBe('talniche')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/experiments/mushika-run/spawn.test.ts`

Expected: FAIL with `Failed to resolve import './spawn'`.

- [ ] **Step 3: Write spawn**

Create `src/experiments/mushika-run/spawn.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/experiments/mushika-run/spawn.test.ts`

Expected: PASS.

If `places a single ukadiche` fails because lane is not `0`, check rng order: `floor(0 * 4) = 0` then `floor(0.5 * 3) = 1` → lane `0`, then `baseAt` uses `0` → `distance + 20`. Adjust the test’s expected lane to match that order rather than changing the producer.

- [ ] **Step 5: Commit**

```bash
git add src/experiments/mushika-run/spawn.ts src/experiments/mushika-run/spawn.test.ts
git commit -m "$(cat <<'EOF'
feat: add seeded Mushika Run spawn patterns

EOF
)"
```

---

### Task 4: Snapshot reducer

**Files:**
- Create: `src/experiments/mushika-run/reduce.ts`
- Test: `src/experiments/mushika-run/reduce.test.ts`

**Interfaces:**
- Consumes: `spawnNext`, constants (`SPEED`, `JUMP_S`, `MODAK`, `GATES`, `COLLECT_RADIUS`, `HIGH_JUMP_MIN`, `HIGH_JUMP_MAX`, `DESPAWN_BEHIND`, `SPAWN_AHEAD_*`, `GATE_POINTS`, `drainPerSecond`).
- Produces: `Snapshot`, `Event`, `Cue`, `Modak`, `initialSnapshot()`, `reduce(state, event, rng)`.

Events: `{ type: 'tick', dt }`, `{ type: 'laneLeft' }`, `{ type: 'laneRight' }`, `{ type: 'jump' }`, `{ type: 'restart' }`. While `phase === 'over'`, `jump` and `restart` both return `initialSnapshot()`; other events are no-ops. Ticks while `over` do not move `distance`.

- [ ] **Step 1: Write the failing tests**

Create `src/experiments/mushika-run/reduce.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { SPEED } from './constants'
import { initialSnapshot, reduce, type Snapshot } from './reduce'

function seqRng(values: number[]) {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]!
}

const quiet = seqRng([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

function playing(extra: Partial<Snapshot> = {}): Snapshot {
  return { ...initialSnapshot(), ...extra }
}

describe('tick motion and hunger', () => {
  it('adds 10 m/s to distance', () => {
    const next = reduce(playing(), { type: 'tick', dt: 0.5 }, quiet)
    expect(next.distance).toBeCloseTo(5)
  })

  it('drains 0.10/s with no gates', () => {
    const next = reduce(playing({ hunger: 1 }), { type: 'tick', dt: 1 }, quiet)
    expect(next.hunger).toBeCloseTo(0.9)
    expect(next.phase).toBe('playing')
  })

  it('goes over at hunger 0 and further ticks freeze distance', () => {
    const dead = reduce(playing({ hunger: 0.01 }), { type: 'tick', dt: 1 }, quiet)
    expect(dead.phase).toBe('over')
    expect(dead.hunger).toBe(0)
    expect(dead.cue).toBe('rumble')
    const later = reduce(dead, { type: 'tick', dt: 1 }, quiet)
    expect(later.distance).toBe(dead.distance)
    expect(later.phase).toBe('over')
  })

  it('uses 1.15× drain after one gate and caps after five', () => {
    const after1 = reduce(
      playing({ hunger: 1, gatesReached: ['siddhivinayak'] }),
      { type: 'tick', dt: 1 },
      quiet,
    )
    expect(after1.hunger).toBeCloseTo(1 - 0.1 * 1.15)
    const five = ['siddhivinayak', 'andhericha-raja', 'dagadusheth', 'kasba-ganpati', 'lalbaugcha-raja'] as const
    const a = reduce(playing({ hunger: 1, gatesReached: [...five] }), { type: 'tick', dt: 1 }, quiet)
    const b = reduce(playing({ hunger: 1, gatesReached: [...five, 'siddhivinayak'] }), { type: 'tick', dt: 1 }, quiet)
    expect(a.hunger).toBeCloseTo(b.hunger)
  })
})

describe('lanes and jump', () => {
  it('clamps lane to -1 | 0 | 1', () => {
    expect(reduce(playing({ lane: -1 }), { type: 'laneLeft' }, quiet).lane).toBe(-1)
    expect(reduce(playing({ lane: 1 }), { type: 'laneRight' }, quiet).lane).toBe(1)
    expect(reduce(playing({ lane: 0 }), { type: 'laneLeft' }, quiet).lane).toBe(-1)
  })

  it('starts a hop only on the ground and ignores double-jump', () => {
    const hop = reduce(playing(), { type: 'jump' }, quiet)
    expect(hop.jumpT).toBe(0)
    expect(reduce(hop, { type: 'jump' }, quiet).jumpT).toBe(0)
    const mid = reduce(playing({ jumpT: 0 }), { type: 'tick', dt: 0.225 }, quiet)
    expect(mid.jumpT).toBeCloseTo(0.5)
    const land = reduce(playing({ jumpT: 0.9 }), { type: 'tick', dt: 0.1 }, quiet)
    expect(land.jumpT).toBeNull()
  })
})

describe('collect', () => {
  it('collects a matching ground modak and clamps hunger to 1', () => {
    const next = reduce(
      playing({
        lane: 0,
        hunger: 0.9,
        distance: 10,
        modaks: [{ id: 1, kind: 'king', lane: 0, high: false, atDistance: 10 }],
      }),
      { type: 'tick', dt: 0 },
      quiet,
    )
    expect(next.score).toBe(50)
    expect(next.hunger).toBe(1)
    expect(next.modaks.some((m) => m.id === 1)).toBe(false)
    expect(next.cue).toBe('nibble')
    expect(next.seq).toBe(1)
  })

  it('ignores the wrong lane', () => {
    const next = reduce(
      playing({
        lane: 1,
        distance: 10,
        modaks: [{ id: 1, kind: 'ukadiche', lane: 0, high: false, atDistance: 10 }],
      }),
      { type: 'tick', dt: 0 },
      quiet,
    )
    expect(next.score).toBe(0)
    expect(next.modaks.some((m) => m.id === 1)).toBe(true)
  })

  it('ignores a high modak unless jumpT is near apex', () => {
    const m = { id: 1, kind: 'talniche' as const, lane: 0, high: true, atDistance: 10 }
    const grounded = reduce(playing({ distance: 10, jumpT: null, modaks: [m] }), { type: 'tick', dt: 0 }, quiet)
    expect(grounded.modaks.some((x) => x.id === 1)).toBe(true)
    const early = reduce(playing({ distance: 10, jumpT: 0.2, modaks: [m] }), { type: 'tick', dt: 0 }, quiet)
    expect(early.modaks.some((x) => x.id === 1)).toBe(true)
    const apex = reduce(playing({ distance: 10, jumpT: 0.5, modaks: [m] }), { type: 'tick', dt: 0 }, quiet)
    expect(apex.modaks.some((x) => x.id === 1)).toBe(false)
    expect(apex.score).toBe(25)
  })
})

describe('gates', () => {
  it('awards Siddhivinayak once at 80 m', () => {
    const hit = reduce(playing({ distance: 79 }), { type: 'tick', dt: 0.2 }, quiet)
    expect(hit.distance).toBeCloseTo(81)
    expect(hit.gatesReached).toEqual(['siddhivinayak'])
    expect(hit.score).toBe(100)
    expect(hit.cue).toBe('bell')
    const later = reduce(hit, { type: 'tick', dt: 1 }, quiet)
    expect(later.gatesReached).toEqual(['siddhivinayak'])
  })
})

describe('restart', () => {
  it('restores the initial snapshot from over via jump or restart', () => {
    const over = playing({
      phase: 'over',
      hunger: 0,
      score: 40,
      distance: 90,
      lane: 1,
      gatesReached: ['siddhivinayak'],
    })
    for (const ev of [{ type: 'restart' as const }, { type: 'jump' as const }]) {
      const next = reduce(over, ev, quiet)
      expect(next).toEqual(initialSnapshot())
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/experiments/mushika-run/reduce.test.ts`

Expected: FAIL with `Failed to resolve import './reduce'`.

- [ ] **Step 3: Write reduce**

Create `src/experiments/mushika-run/reduce.ts`:

```ts
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
  for (const m of next.modaks) {
    if (canCollect(next, m)) {
      hunger = Math.min(1, hunger + MODAK[m.kind].hunger)
      score += MODAK[m.kind].points
      collected = true
    } else {
      kept.push(m)
    }
  }
  next = { ...next, modaks: kept, hunger, score }
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/experiments/mushika-run/reduce.test.ts`

Expected: PASS.

If the “caps after five” case fails because the extra `'siddhivinayak'` is already in the list, that is the point: `gatesReached.length` is 6 but drain still uses `min(count, 5)`. Duplicate ids should not happen in play; the test only checks the cap function’s `length`. If `includes` prevents a duplicate from being appended on tick, construct the 6-id array directly as written.

If starve-on-first-tick also spawns and the hunger assertion drifts, use `dt: 1` with `hunger: 0.01` as written — drain 0.10 exceeds 0.01 regardless of spawn.

- [ ] **Step 5: Commit**

```bash
git add src/experiments/mushika-run/reduce.ts src/experiments/mushika-run/reduce.test.ts
git commit -m "$(cat <<'EOF'
feat: add Mushika Run snapshot reducer

EOF
)"
```

---

### Task 5: Swipe, tap, and keyboard input

**Files:**
- Create: `src/experiments/mushika-run/input.ts`
- Test: `src/experiments/mushika-run/input.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks (commands are strings the reducer already understands).
- Produces: `Command = 'laneLeft' | 'laneRight' | 'jump'`, `SWIPE_PX = 30`, `commandFromSwipe(dx, dy)`, `commandFromKey(event)`, `subscribeMushikaInput(window, root, onCommand, isActive)`.

Touch lives on the full-viewport wrapper. Dominant-axis swipe, 30 px threshold. Down ignored. Tap (movement below threshold, `pointerup` on the same target) → `jump`. Pointer on `<a>` ignored. `preventDefault` on `touchmove` and on Space. Ignore `event.repeat`.

- [ ] **Step 1: Write the failing tests**

Create `src/experiments/mushika-run/input.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { commandFromKey, commandFromSwipe, subscribeMushikaInput } from './input'

describe('commandFromSwipe', () => {
  it('uses the dominant axis past 30 px', () => {
    expect(commandFromSwipe(-40, 10)).toBe('laneLeft')
    expect(commandFromSwipe(40, -10)).toBe('laneRight')
    expect(commandFromSwipe(10, -40)).toBe('jump')
    expect(commandFromSwipe(10, 40)).toBeNull()
    expect(commandFromSwipe(20, 20)).toBeNull()
  })
})

describe('commandFromKey', () => {
  it('maps arrows/WASD/Space and ignores other keys and repeat', () => {
    expect(commandFromKey({ code: 'ArrowLeft', repeat: false } as KeyboardEvent)).toBe('laneLeft')
    expect(commandFromKey({ code: 'KeyA', repeat: false } as KeyboardEvent)).toBe('laneLeft')
    expect(commandFromKey({ code: 'ArrowRight', repeat: false } as KeyboardEvent)).toBe('laneRight')
    expect(commandFromKey({ code: 'KeyD', repeat: false } as KeyboardEvent)).toBe('laneRight')
    expect(commandFromKey({ code: 'ArrowUp', repeat: false } as KeyboardEvent)).toBe('jump')
    expect(commandFromKey({ code: 'KeyW', repeat: false } as KeyboardEvent)).toBe('jump')
    expect(commandFromKey({ code: 'Space', repeat: false } as KeyboardEvent)).toBe('jump')
    expect(commandFromKey({ code: 'ArrowDown', repeat: false } as KeyboardEvent)).toBeNull()
    expect(commandFromKey({ code: 'Space', repeat: true } as KeyboardEvent)).toBeNull()
    expect(commandFromKey({ code: 'KeyS', repeat: false } as KeyboardEvent)).toBeNull()
  })
})

describe('subscribeMushikaInput', () => {
  it('fires swipe, tap jump, ignores down-swipe, link pointer, and inactive', () => {
    const root = document.createElement('div')
    const link = document.createElement('a')
    link.href = '/'
    root.appendChild(link)
    document.body.appendChild(root)
    const seen: string[] = []
    let active = true
    const stop = subscribeMushikaInput(window, root, (c) => seen.push(c), () => active)

    root.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true }))
    root.dispatchEvent(new PointerEvent('pointerup', { clientX: 60, clientY: 105, bubbles: true }))
    root.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true }))
    root.dispatchEvent(new PointerEvent('pointerup', { clientX: 104, clientY: 102, bubbles: true }))
    root.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true }))
    root.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 150, bubbles: true }))
    link.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 10, bubbles: true }))
    link.dispatchEvent(new PointerEvent('pointerup', { clientX: 10, clientY: 10, bubbles: true }))

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft', bubbles: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft', repeat: true, bubbles: true }))
    active = false
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))

    expect(seen).toEqual(['laneLeft', 'jump', 'laneLeft'])
    stop()
    root.remove()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/experiments/mushika-run/input.test.ts`

Expected: FAIL with `Failed to resolve import './input'`.

- [ ] **Step 3: Write input**

Create `src/experiments/mushika-run/input.ts`:

```ts
export type Command = 'laneLeft' | 'laneRight' | 'jump'

export const SWIPE_PX = 30

export function commandFromSwipe(dx: number, dy: number): Command | null {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ax < SWIPE_PX && ay < SWIPE_PX) return null
  if (ax >= ay) return dx < 0 ? 'laneLeft' : 'laneRight'
  if (dy < 0) return 'jump'
  return null
}

export function commandFromKey(event: KeyboardEvent): Command | null {
  if (event.repeat) return null
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') return 'laneLeft'
  if (event.code === 'ArrowRight' || event.code === 'KeyD') return 'laneRight'
  if (event.code === 'ArrowUp' || event.code === 'KeyW' || event.code === 'Space') return 'jump'
  return null
}

function isLinkTarget(event: Event): boolean {
  const t = event.target
  return t instanceof Element && t.closest('a') !== null
}

export function subscribeMushikaInput(
  windowTarget: Window,
  root: HTMLElement,
  onCommand: (command: Command) => void,
  isActive: () => boolean,
): () => void {
  let down: { x: number; y: number; ignore: boolean } | null = null

  const onKey = (event: KeyboardEvent) => {
    if (!isActive()) return
    const command = commandFromKey(event)
    if (!command) return
    if (event.code === 'Space') event.preventDefault()
    onCommand(command)
  }

  const onPointerDown = (event: PointerEvent) => {
    down = { x: event.clientX, y: event.clientY, ignore: isLinkTarget(event) }
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!down) return
    const start = down
    down = null
    if (!isActive() || start.ignore) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    const swipe = commandFromSwipe(dx, dy)
    if (swipe) {
      onCommand(swipe)
      return
    }
    if (Math.hypot(dx, dy) < SWIPE_PX) onCommand('jump')
  }

  const onPointerCancel = () => {
    down = null
  }

  const onTouchMove = (event: TouchEvent) => {
    if (!isActive()) return
    event.preventDefault()
  }

  windowTarget.addEventListener('keydown', onKey)
  root.addEventListener('pointerdown', onPointerDown)
  root.addEventListener('pointerup', onPointerUp)
  root.addEventListener('pointercancel', onPointerCancel)
  root.addEventListener('touchmove', onTouchMove, { passive: false })
  return () => {
    windowTarget.removeEventListener('keydown', onKey)
    root.removeEventListener('pointerdown', onPointerDown)
    root.removeEventListener('pointerup', onPointerUp)
    root.removeEventListener('pointercancel', onPointerCancel)
    root.removeEventListener('touchmove', onTouchMove)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/experiments/mushika-run/input.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/experiments/mushika-run/input.ts src/experiments/mushika-run/input.test.ts
git commit -m "$(cat <<'EOF'
feat: add Mushika Run swipe and keyboard input

EOF
)"
```

---

### Task 6: Overlapping one-shot audio

**Files:**
- Create: `src/experiments/mushika-run/audio.ts`
- Test: `src/experiments/mushika-run/audio.test.ts`

**Interfaces:**
- Consumes: Dahi Handi’s overlapping-player pattern (copy, do not import `createSmashPlayer` — that type is smash-only).
- Produces: `RunSound = 'nibble' | 'bell' | 'rumble'`, `createMushikaPlayer({ basePath, fetchImpl, decode, context })` with `play(name)`, `unlock()`, `stopAll()`, `dispose()`. Overlapping one-shots allowed. Missing files resolve without throwing.

- [ ] **Step 1: Write the failing tests**

Create `src/experiments/mushika-run/audio.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { createMushikaPlayer } from './audio'

function mockContext() {
  const started: string[] = []
  const stopped: string[] = []
  const ctx = {
    currentTime: 0,
    state: 'running' as AudioContextState,
    resume: vi.fn(async () => {}),
    decodeAudioData: vi.fn(async () => ({ duration: 1 })),
    createBufferSource() {
      const src = {
        buffer: null as AudioBuffer | null,
        connect: vi.fn(),
        start: vi.fn(() => started.push('start')),
        stop: vi.fn(() => stopped.push('stop')),
        disconnect: vi.fn(),
        onended: null as (() => void) | null,
      }
      return src
    },
    createGain() {
      return { gain: { value: 1 }, connect: vi.fn() }
    },
    destination: {},
  }
  return { ctx: ctx as unknown as AudioContext, started, stopped }
}

describe('createMushikaPlayer', () => {
  it('starts nibble then bell without stopping the first', async () => {
    const { ctx, started, stopped } = mockContext()
    const player = createMushikaPlayer({
      basePath: '/assets/mushika-run/audio',
      context: ctx,
      fetchImpl: (async () => new Response(new ArrayBuffer(8))) as typeof fetch,
      decode: async () => ({ duration: 1 }) as AudioBuffer,
    })
    await player.play('nibble')
    await player.play('bell')
    expect(started).toHaveLength(2)
    expect(stopped).toHaveLength(0)
    player.dispose()
  })

  it('resolves when a file is missing', async () => {
    const { ctx } = mockContext()
    const player = createMushikaPlayer({
      basePath: '/assets/mushika-run/audio',
      context: ctx,
      fetchImpl: (async () => {
        throw new Error('404')
      }) as typeof fetch,
    })
    await expect(player.play('rumble')).resolves.toBeUndefined()
    player.dispose()
  })

  it('stopAll stops live sources', async () => {
    const { ctx, stopped } = mockContext()
    const player = createMushikaPlayer({
      basePath: '/assets/mushika-run/audio',
      context: ctx,
      fetchImpl: (async () => new Response(new ArrayBuffer(8))) as typeof fetch,
      decode: async () => ({ duration: 1 }) as AudioBuffer,
    })
    await player.play('nibble')
    player.stopAll()
    expect(stopped.length).toBeGreaterThanOrEqual(1)
    player.dispose()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/experiments/mushika-run/audio.test.ts`

Expected: FAIL with `Failed to resolve import './audio'`.

- [ ] **Step 3: Write audio**

Create `src/experiments/mushika-run/audio.ts` (same structure as `src/experiments/dahi-handi/audio.ts`, named shots instead of a smash pair):

```ts
export type RunSound = 'nibble' | 'bell' | 'rumble'

type Source = { stop: () => void; disconnect: () => void }

export type MushikaPlayer = {
  play(name: RunSound): Promise<void>
  unlock(): Promise<void>
  stopAll(): void
  dispose(): void
}

export function createMushikaPlayer(opts: {
  basePath: string
  fetchImpl?: typeof fetch
  decode?: (ctx: AudioContext, buf: ArrayBuffer) => Promise<AudioBuffer>
  context?: AudioContext
}): MushikaPlayer {
  const fetchImpl = opts.fetchImpl ?? fetch
  const ownsContext = opts.context === undefined
  let ctx = opts.context
  let generation = 0
  const live = new Set<Source>()
  const cache = new Map<RunSound, AudioBuffer>()

  function ensureCtx(): AudioContext {
    if (!ctx) ctx = new AudioContext()
    return ctx
  }

  function stopAll() {
    generation++
    for (const src of live) {
      try {
        src.stop()
      } catch {
        // already stopped
      }
      src.disconnect()
    }
    live.clear()
  }

  async function playOne(name: RunSound, playGen: number): Promise<void> {
    try {
      const audio = ensureCtx()
      if (audio.state === 'suspended') await audio.resume()
      let buffer = cache.get(name)
      if (!buffer) {
        const res = await fetchImpl(`${opts.basePath}/${name}.mp3`)
        if (playGen !== generation) return
        if (!res.ok) return
        const raw = await res.arrayBuffer()
        buffer = opts.decode ? await opts.decode(audio, raw) : await audio.decodeAudioData(raw)
        if (playGen !== generation) return
        cache.set(name, buffer)
      }
      if (playGen !== generation) return
      const src = audio.createBufferSource()
      const gain = audio.createGain()
      gain.gain.value = 1
      src.buffer = buffer
      src.connect(gain)
      gain.connect(audio.destination)
      live.add(src)
      src.onended = () => {
        live.delete(src)
      }
      src.start()
    } catch {
      // missing file or decode failure — skip
    }
  }

  return {
    async play(name) {
      await playOne(name, generation)
    },
    async unlock() {
      try {
        const audio = ensureCtx()
        if (audio.state === 'suspended') await audio.resume()
      } catch {
        // TV / Safari may still block until a later gesture
      }
    },
    stopAll,
    dispose() {
      stopAll()
      cache.clear()
      if (ownsContext && ctx) {
        void ctx.close()
        ctx = undefined
      }
    },
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/experiments/mushika-run/audio.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/experiments/mushika-run/audio.ts src/experiments/mushika-run/audio.test.ts
git commit -m "$(cat <<'EOF'
feat: add Mushika Run overlapping one-shot player

EOF
)"
```

---

### Task 7: Optional `dpr` on `ExperienceCanvas`

**Files:**
- Modify: `src/shared/r3f/ExperienceCanvas.tsx`
- Test: `src/shared/r3f/ExperienceCanvas.test.ts` (existing export test still passes; no new packages)

**Interfaces:**
- Consumes: existing `camera` prop.
- Produces: optional `dpr?: [number, number]`. When omitted, R3F keeps its default (Cat World and Dahi Handi unchanged). Mushika Run will pass `dpr={[1, 2]}` in Task 8.

- [ ] **Step 1: Write the failing test**

Replace `src/shared/r3f/ExperienceCanvas.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { ExperienceCanvas } from './ExperienceCanvas'
import { Yard } from '../../experiments/cat-world/Yard'

describe('yard exports', () => {
  it('exposes Canvas wrapper and Yard', () => {
    expect(typeof ExperienceCanvas).toBe('function')
    expect(typeof Yard).toBe('function')
  })
})

describe('ExperienceCanvas', () => {
  it('is a function that accepts an optional dpr tuple', () => {
    expect(ExperienceCanvas.length).toBe(1)
  })
})
```

This test already passes against today’s wrapper. That is OK: the behavior change is the new optional prop. Do not change Cat World or Dahi Handi call sites.

- [ ] **Step 2: Run the existing test (baseline)**

Run: `npx vitest run src/shared/r3f/ExperienceCanvas.test.ts`

Expected: PASS.

- [ ] **Step 3: Add the optional `dpr` prop**

Replace `src/shared/r3f/ExperienceCanvas.tsx` with:

```tsx
import { Canvas } from '@react-three/fiber'
import type { ReactNode } from 'react'

export function ExperienceCanvas({
  children,
  camera = { position: [0, 1.1, 4.2], fov: 35 },
  dpr,
}: {
  children: ReactNode
  camera?: { position: [number, number, number]; fov: number }
  dpr?: [number, number]
}) {
  return (
    <Canvas
      camera={camera}
      shadows
      dpr={dpr}
      style={{ width: '100%', height: '100%', display: 'block' }}
      gl={{ antialias: true }}
    >
      {children}
    </Canvas>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/shared/r3f/ExperienceCanvas.test.ts src/experiments/dahi-handi src/experiments/cat-world`

Expected: PASS. Cat World and Dahi Handi still typecheck because `dpr` is optional.

- [ ] **Step 5: Commit**

```bash
git add src/shared/r3f/ExperienceCanvas.tsx src/shared/r3f/ExperienceCanvas.test.ts
git commit -m "$(cat <<'EOF'
feat: allow optional dpr on ExperienceCanvas

EOF
)"
```

---

### Task 8: Street, mouse, modaks, gates, Bhuk, canvas

**Files:**
- Create: `src/experiments/mushika-run/MushikaBoundary.tsx`
- Create: `src/experiments/mushika-run/Street.tsx`
- Create: `src/experiments/mushika-run/Mushika.tsx`
- Create: `src/experiments/mushika-run/Modak.tsx`
- Create: `src/experiments/mushika-run/Gate.tsx`
- Create: `src/experiments/mushika-run/Bhuk.tsx`
- Create: `src/experiments/mushika-run/MushikaRun.tsx`

**Interfaces:**
- Consumes: `Snapshot`, `CAMERA_*`, `DPR`, `LOOK_AT`, `GATES`, `laneX`, `jumpY`, `worldZ`, `LANE_LERP_S`.
- Produces: `MushikaRun({ world, onTick })` — one `useFrame` calls `onTick(min(dt, DT_CAP))` when `document.visibilityState === 'visible'`. No unit tests for meshes.

Lights: ambient ~0.35 plus two warm `pointLight`s, **no** `castShadow` on lights. Blob shadow is a dark circle under the mouse, not a shadow map.

- [ ] **Step 1: Error boundary**

Create `src/experiments/mushika-run/MushikaBoundary.tsx` (same shape as `DahiBoundary`):

```tsx
import { Component, type ReactNode } from 'react'

export class MushikaBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { error: boolean }
> {
  state = { error: false }
  static getDerivedStateFromError() {
    return { error: true }
  }
  render() {
    return this.state.error ? this.props.fallback : this.props.children
  }
}
```

- [ ] **Step 2: Street tiles**

Create `src/experiments/mushika-run/Street.tsx`:

```tsx
import { worldZ } from './constants'

const TILE_LEN = 8
const TILE_COUNT = 8
const ROAD = '#2a1c28'
const MARIGOLD = '#e8a317'
const RANGOLI = '#c4452d'
const LEAF = '#3d6b2f'
const SAFFRON = '#ef6c00'

function Tile({ variant }: { variant: number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[5.2, TILE_LEN]} />
        <meshStandardMaterial color={ROAD} roughness={0.9} />
      </mesh>
      {[-2.35, 2.35].map((x) => (
        <mesh key={x} position={[x, 0.04, 0]}>
          <boxGeometry args={[0.18, 0.08, TILE_LEN]} />
          <meshStandardMaterial color={variant % 2 === 0 ? MARIGOLD : LEAF} />
        </mesh>
      ))}
      {variant === 1 ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[1.1, TILE_LEN * 0.7]} />
          <meshStandardMaterial color={RANGOLI} />
        </mesh>
      ) : null}
      {variant === 2
        ? [-1.3, 0, 1.3].map((x) => (
            <mesh key={x} position={[x, 1.6, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#ffe9a0" emissive="#ffd27a" emissiveIntensity={1.4} />
            </mesh>
          ))
        : null}
      {variant === 3 ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.6, 0.25]} />
          <meshStandardMaterial color={SAFFRON} />
        </mesh>
      ) : null}
    </group>
  )
}

export function Street({ distance }: { distance: number }) {
  const start = Math.floor(distance / TILE_LEN) - 1
  const tiles = Array.from({ length: TILE_COUNT }, (_, i) => start + i)
  return (
    <group>
      {tiles.map((i) => (
        <group key={i} position={[0, 0, worldZ(i * TILE_LEN + TILE_LEN / 2, distance)]}>
          <Tile variant={((i % 4) + 4) % 4} />
        </group>
      ))}
      <ambientLight intensity={0.35} />
      <pointLight position={[-1.4, 3.2, 2]} intensity={12} color="#ffd9a0" distance={16} />
      <pointLight position={[1.6, 2.8, -4]} intensity={8} color="#ffcc88" distance={14} />
    </group>
  )
}
```

- [ ] **Step 3: Mushika mesh**

Create `src/experiments/mushika-run/Mushika.tsx`:

```tsx
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { LANE_LERP_S, jumpY, laneX } from './constants'
import type { Snapshot } from './reduce'

const FUR = '#8a5a3c'
const DARK = '#4a2e22'
const PINK = '#e8a090'
const EYE = '#1a120c'

export function Mushika({ world }: { world: Snapshot }) {
  const ref = useRef<Group>(null)

  useFrame(({ clock }, dt) => {
    const g = ref.current
    if (!g) return
    const target = laneX(world.lane)
    const k = 1 - Math.exp(-dt / LANE_LERP_S)
    g.position.x += (target - g.position.x) * k
    let y = jumpY(world.jumpT)
    if (world.jumpT === null && world.phase === 'playing') {
      y += Math.abs(Math.sin(clock.elapsedTime * 14)) * 0.04
    }
    g.position.y = y
    g.position.z = 0
    const stretch = world.jumpT !== null ? 1.12 : 1
    g.scale.set(1, stretch, 1)
  })

  return (
    <group ref={ref} position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.28, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, 0.16, 0.02]} scale={[1, 0.75, 1.35]}>
        <sphereGeometry args={[0.16, 14, 14]} />
        <meshStandardMaterial color={FUR} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.38, 0.06]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={FUR} roughness={0.65} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.12, 0.5, 0.02]} rotation={[0.2, 0, s * -0.4]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color={FUR} roughness={0.7} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`in-${s}`} position={[s * 0.12, 0.5, 0.03]} rotation={[0.2, 0, s * -0.4]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={PINK} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`e-${s}`} position={[s * 0.05, 0.4, 0.16]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color={EYE} />
        </mesh>
      ))}
      <mesh position={[0, 0.36, 0.18]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={PINK} />
      </mesh>
      <mesh position={[0, 0.18, -0.22]} rotation={[1.1, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.02, 0.38, 6]} />
        <meshStandardMaterial color={DARK} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`l-${s}`} position={[s * 0.07, 0.06, 0.08]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
      ))}
    </group>
  )
}
```

Origin is at the feet. Height is ~0.55 m (head top ≈ 0.51). Run bob is visual only.

- [ ] **Step 4: Modak, Gate, Bhuk**

Create `src/experiments/mushika-run/Modak.tsx`:

```tsx
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'
import { laneX, worldZ } from './constants'
import type { Modak as ModakState } from './reduce'

const COLORS = {
  ukadiche: '#f3e6c8',
  talniche: '#e0a020',
  king: '#f7f4ea',
}

export function Modak({ modak, distance }: { modak: ModakState; distance: number }) {
  const spark = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (spark.current) spark.current.rotateY(clock.getDelta() * 4)
  })
  const y = modak.high ? 0.7 : 0.12
  return (
    <group position={[laneX(modak.lane), y, worldZ(modak.atDistance, distance)]}>
      {modak.kind === 'ukadiche' ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
          <circleGeometry args={[0.12, 10]} />
          <meshStandardMaterial color="#3d6b2f" />
        </mesh>
      ) : null}
      <mesh>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color={COLORS[modak.kind]} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.07, 0]} scale={[0.7, 0.45, 0.7]}>
        <sphereGeometry args={[0.07, 10, 12]} />
        <meshStandardMaterial color={COLORS[modak.kind]} roughness={0.5} />
      </mesh>
      {modak.kind === 'king' ? (
        <mesh ref={spark} position={[0.08, 0.12, 0.04]}>
          <octahedronGeometry args={[0.04, 0]} />
          <meshStandardMaterial color="#ffe27a" emissive="#ffe27a" emissiveIntensity={1.6} />
        </mesh>
      ) : null}
    </group>
  )
}
```

Create `src/experiments/mushika-run/Gate.tsx`:

```tsx
import { Text } from '@react-three/drei'
import { worldZ, type GateId } from './constants'

export function Gate({
  name,
  id,
  atDistance,
  distance,
  reached,
}: {
  name: string
  id: GateId
  atDistance: number
  distance: number
  reached: boolean
}) {
  const z = worldZ(atDistance, distance)
  if (z < -28 || z > 10) return null
  const flash = reached && distance - atDistance >= 0 && distance - atDistance < 2
  const saffron = flash ? '#ffb347' : '#ef6c00'
  const fontSize = name.length > 14 ? 0.13 : 0.16
  return (
    <group position={[0, 0, z]}>
      {[-2.15, 2.15].map((x) => (
        <mesh key={x} position={[x, 1.2, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 2.4, 8]} />
          <meshStandardMaterial color={saffron} />
        </mesh>
      ))}
      <mesh position={[0, 2.35, 0]}>
        <boxGeometry args={[4.6, 0.28, 0.22]} />
        <meshStandardMaterial color="#c4452d" emissive={flash ? '#ff7a18' : '#000'} emissiveIntensity={flash ? 0.8 : 0} />
      </mesh>
      <mesh position={[0, 2.55, 0]} rotation={[0, 0, 0.05]}>
        <torusGeometry args={[0.18, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#e8a317" />
      </mesh>
      <Text position={[0, 2.35, 0.14]} fontSize={fontSize} color="#3a1208" anchorX="center" anchorY="middle">
        {name}
      </Text>
    </group>
  )
}
```

Create `src/experiments/mushika-run/Bhuk.tsx`:

```tsx
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'

export function Bhuk({ hunger, over }: { hunger: number; over: boolean }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const h = over ? 0 : hunger
    const z = 1.1 + h * 4.8
    const scale = 1.1 + (1 - h) * 2.4
    g.position.set(0, 0.4 + Math.sin(clock.elapsedTime * 6) * 0.05 * (1 - h), z)
    g.scale.setScalar(scale)
  })
  const h = over ? 0 : hunger
  const opacity = 0.12 + (1 - h) * 0.55
  return (
    <group ref={ref} position={[0, 0.4, 1.1 + hunger * 4.8]}>
      <mesh scale={[1.6, 0.7, 0.5]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial color="#2a0810" transparent opacity={opacity} roughness={1} />
      </mesh>
      <mesh position={[0, -0.05, 0.35]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[0.35, 0.08, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#4a1020" transparent opacity={opacity + 0.1} />
      </mesh>
    </group>
  )
}
```

Hunger `1` → almost at the camera (`z ≈ 5.9`). Hunger `0.2` → `z ≈ 2.06`, large enough to fill the bottom third. Hunger `0` / `over` → swallows the mouse.

- [ ] **Step 5: Canvas scene with one clock**

Create `src/experiments/mushika-run/MushikaRun.tsx`:

```tsx
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { ExperienceCanvas } from '../../shared/r3f/ExperienceCanvas'
import {
  CAMERA_FOV,
  CAMERA_FOV_PORTRAIT,
  CAMERA_POS,
  DPR,
  DT_CAP,
  GATES,
  LOOK_AT,
} from './constants'
import { Bhuk } from './Bhuk'
import { Gate } from './Gate'
import { Modak } from './Modak'
import { Mushika } from './Mushika'
import { Street } from './Street'
import type { Snapshot } from './reduce'

function CameraRig() {
  const { camera, size } = useThree()
  useLayoutEffect(() => {
    camera.lookAt(...LOOK_AT)
    const portrait = size.height > size.width
    camera.fov = portrait ? CAMERA_FOV_PORTRAIT : CAMERA_FOV
    camera.updateProjectionMatrix()
  }, [camera, size.height, size.width])
  return null
}

function Tick({ onTick }: { onTick: (dt: number) => void }) {
  useFrame((_, dt) => {
    if (document.visibilityState !== 'visible') return
    onTick(Math.min(dt, DT_CAP))
  })
  return null
}

export function MushikaRun({ world, onTick }: { world: Snapshot; onTick: (dt: number) => void }) {
  return (
    <ExperienceCanvas camera={{ position: CAMERA_POS, fov: CAMERA_FOV }} dpr={DPR}>
      <CameraRig />
      <Tick onTick={onTick} />
      <Street distance={world.distance} />
      <Mushika world={world} />
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
        />
      ))}
      <Bhuk hunger={world.hunger} over={world.phase === 'over'} />
    </ExperienceCanvas>
  )
}
```

- [ ] **Step 6: Typecheck the new files**

Run: `npx tsc -b --pretty false`

Expected: no errors in `src/experiments/mushika-run/*`.

- [ ] **Step 7: Commit**

```bash
git add src/experiments/mushika-run/MushikaBoundary.tsx src/experiments/mushika-run/Street.tsx src/experiments/mushika-run/Mushika.tsx src/experiments/mushika-run/Modak.tsx src/experiments/mushika-run/Gate.tsx src/experiments/mushika-run/Bhuk.tsx src/experiments/mushika-run/MushikaRun.tsx
git commit -m "$(cat <<'EOF'
feat: add Mushika Run festive street meshes

EOF
)"
```

---

### Task 9: Hook, overlays, sounds, docs

**Files:**
- Create: `src/experiments/mushika-run/useMushikaRun.ts`
- Create: `src/experiments/mushika-run/Overlays.tsx`
- Modify: `src/experiments/mushika-run/index.tsx`
- Create: `public/assets/mushika-run/audio/nibble.mp3`
- Create: `public/assets/mushika-run/audio/bell.mp3`
- Create: `public/assets/mushika-run/audio/rumble.mp3`
- Create: `public/assets/mushika-run/ATTRIBUTION.md`
- Modify: `README.md`
- Create: `learningNotes/mushika-run.md`
- Modify: `docs/roadmap/README.md`

**Interfaces:**
- Consumes: `initialSnapshot`, `reduce`, `createMushikaPlayer`, `subscribeMushikaInput`, `MushikaRun`, `MushikaBoundary`, `HINT_DISTANCE`, `TOAST_MS`, `nextGateLine`, `lastGateLabel`.
- Produces: a playable `/mushika-run` page. `useMushikaRun` returns `{ world, rootRef, tick }`. Overlay copy matches the spec HUD table. `pointer-events: none` except the home link and the game-over restart card.

- [ ] **Step 1: Download CC0 audio and write attribution**

```bash
mkdir -p public/assets/mushika-run/audio
curl -L -A "Mozilla/5.0" -o public/assets/mushika-run/audio/nibble.mp3 "https://bigsoundbank.com/UPLOAD/mp3/352.mp3"
curl -L -A "Mozilla/5.0" -o public/assets/mushika-run/audio/bell.mp3 "https://bigsoundbank.com/UPLOAD/mp3/3446.mp3"
curl -L -A "Mozilla/5.0" -o public/assets/mushika-run/audio/rumble.mp3 "https://bigsoundbank.com/UPLOAD/mp3/2718.mp3"
file public/assets/mushika-run/audio/nibble.mp3 public/assets/mushika-run/audio/bell.mp3 public/assets/mushika-run/audio/rumble.mp3
```

Expected: MPEG/Audio (or “Audio file”), not HTML. If a download is HTML, open the attribution page and use the MP3 link from the Download row instead:

- nibble: [Mouth Noises #1](https://bigsoundbank.com/mouth-noises-1-s0352.html) (#352)
- bell: [Bell 1 O'clock](https://bigsoundbank.com/bell-1-o-clock-s3446.html) (#3446)
- rumble: [Thunder #1](https://bigsoundbank.com/thunder-s2718.html) (#2718)

Create `public/assets/mushika-run/ATTRIBUTION.md`:

```md
# Mushika Run asset licenses

All bundled third-party files are CC0 (public domain). Attribution is not required; listed here so we remember the source.

## BigSoundBank (CC0)

https://bigsoundbank.com — Joseph Sardin / DavidGreck / Axeline T.

| File | Source | Notes |
|---|---|---|
| `audio/nibble.mp3` | [Mouth Noises #1](https://bigsoundbank.com/mouth-noises-1-s0352.html) (#352) | Short mouth noise, ~5s, DavidGreck |
| `audio/bell.mp3` | [Bell 1 O'clock](https://bigsoundbank.com/bell-1-o-clock-s3446.html) (#3446) | Church bell, ~8s, Joseph Sardin & Axeline T. |
| `audio/rumble.mp3` | [Thunder #1](https://bigsoundbank.com/thunder-s2718.html) (#2718) | Single thunder clap, ~23s, Joseph Sardin |
```

Do not add `._*` files.

- [ ] **Step 2: Hook**

Create `src/experiments/mushika-run/useMushikaRun.ts`:

```ts
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { assetUrl } from '../../shared/assetUrl'
import { createMushikaPlayer } from './audio'
import { subscribeMushikaInput, type Command } from './input'
import { initialSnapshot, reduce, type Event } from './reduce'

export function useMushikaRun() {
  const [world, dispatch] = useReducer(
    (s: ReturnType<typeof initialSnapshot>, ev: Event) => reduce(s, ev, Math.random),
    undefined,
    initialSnapshot,
  )
  const location = useLocation()
  const rootRef = useRef<HTMLDivElement>(null)
  const player = useMemo(
    () => createMushikaPlayer({ basePath: assetUrl('assets/mushika-run/audio') }),
    [],
  )

  const tick = useCallback((dt: number) => {
    dispatch({ type: 'tick', dt })
  }, [])

  useEffect(() => {
    if (world.seq === 0 || !world.cue) return
    void player.play(world.cue)
  }, [world.seq, world.cue, player])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onCommand = (command: Command) => {
      void player.unlock()
      dispatch({ type: command })
    }
    const stop = subscribeMushikaInput(
      window,
      root,
      onCommand,
      () => document.visibilityState === 'visible' && location.pathname === '/mushika-run',
    )
    const onVis = () => {
      if (document.visibilityState === 'hidden') player.stopAll()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVis)
      player.stopAll()
      player.dispose()
    }
  }, [player, location.pathname])

  return { world, rootRef, tick }
}
```

Visibility freeze: `Tick` already skips `onTick` while hidden, so hunger does not drain in the background. Audio stops on hide.

- [ ] **Step 3: Overlays and page**

Create `src/experiments/mushika-run/Overlays.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HINT_DISTANCE, TOAST_MS, lastGateLabel, nextGateLine } from './constants'
import type { Snapshot } from './reduce'

export function Overlays({ world }: { world: Snapshot }) {
  const [toast, setToast] = useState<string | null>(null)
  const last = world.gatesReached[world.gatesReached.length - 1]
  useEffect(() => {
    if (!last) return
    setToast(`${lastGateLabel(world.gatesReached)} unlocked`)
    const t = window.setTimeout(() => setToast(null), TOAST_MS)
    return () => window.clearTimeout(t)
  }, [last, world.gatesReached])

  const hungerPct = Math.round(world.hunger * 100)
  const showHint = world.phase === 'playing' && world.distance < HINT_DISTANCE

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
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
            background: '#3a1020',
            overflow: 'hidden',
            border: '1px solid #f0c070',
          }}
        >
          <div
            style={{
              width: `${hungerPct}%`,
              height: '100%',
              background: world.hunger > 0.35 ? '#ef6c00' : '#c4452d',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 18, fontWeight: 700 }}>
          <span>{world.score}</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{nextGateLine(world.distance)}</span>
        </div>
        {toast ? (
          <div style={{ marginTop: 10, fontSize: 16, fontWeight: 700, color: '#ffd27a' }}>{toast}</div>
        ) : null}
        {showHint ? (
          <div style={{ marginTop: 10, fontSize: 15 }}>swipe to change lane · swipe up to jump</div>
        ) : null}
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
            {world.gatesReached.map((id) => (
              <li key={id}>{lastGateLabel([id])}</li>
            ))}
          </ul>
          <div style={{ marginTop: 12, fontWeight: 700 }}>tap or Space — run again</div>
        </div>
      ) : null}
    </div>
  )
}
```

Replace `src/experiments/mushika-run/index.tsx`:

```tsx
import { MushikaBoundary } from './MushikaBoundary'
import { MushikaRun } from './MushikaRun'
import { Overlays } from './Overlays'
import { useMushikaRun } from './useMushikaRun'

export function MushikaRunPage() {
  const { world, rootRef, tick } = useMushikaRun()
  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
        outline: 'none',
        touchAction: 'none',
        background: '#14080e',
      }}
    >
      <MushikaBoundary
        fallback={<div style={{ padding: 24, color: '#f4e6c1' }}>The street could not load. Try refresh.</div>}
      >
        <MushikaRun world={world} onTick={tick} />
      </MushikaBoundary>
      <Overlays world={world} />
    </div>
  )
}
```

- [ ] **Step 4: Docs**

Create `learningNotes/mushika-run.md`:

```md
# Mushika Run

The mouse stays at the origin. Distance is a number on the snapshot; tiles, modaks, and gates are placed at `worldZ = distance - atDistance` so the street scrolls toward +Z (the camera). Collects and gates use that number, not mesh X.

`useFrame` is the only clock. The reducer ticks inside it. Lane lerp and hop stretch are visual and must not decide collects.

Hunger is the fail condition. Bhuk’s Z/scale are functions of the same `hunger` the HUD bar reads, so they cannot disagree.

Audio copies Dahi Handi’s overlapping player (not Cat World’s one-voice player) because nibble and a late bell must be allowed to overlap.
```

In `README.md`, add `/mushika-run` to the run list under `/dahi-handi`, and add a section after Dahi Handi:

```md
- `/mushika-run` — Mushika runs three festive lanes. Portrait-first.

## Mushika Run

Procedural mesh mouse on a recycled Ganesh-night street.

- Auto-run, swipe to change lane, swipe up or tap to jump.
- Eat modaks to keep Hunger back. Bhuk is the only fail.
- Five named pandal gates. The pilgrimage list is this run only.

Assets: `public/assets/mushika-run`. Licenses: `public/assets/mushika-run/ATTRIBUTION.md`.
```

In `docs/roadmap/README.md`, leave the GPU ladder table as-is (shader-pond stays **Next**). After the table add:

```md
Off-ladder festival scenes (not GPU-ladder items): Dahi Handi (`/dahi-handi`), Mushika Run (`/mushika-run`, portrait-first).
```

- [ ] **Step 5: Run the full unit suite**

Run: `npx vitest run`

Expected: PASS, including the new mushika-run tests and existing cat-world / dahi-handi tests.

- [ ] **Step 6: Manual pass on a phone (or desktop fallback)**

`npm run dev`, open `/mushika-run`.

- Portrait: three lanes readable under the HUD; hunger bar in the top safe-area; path visible in the lower two-thirds.
- Swipe left/right changes lane; swipe up / tap jumps; a high modak only collects near apex.
- Hunger bar and Bhuk close in together.
- First gate toasts `Siddhivinayak unlocked` and the lintel names it.
- Starve → `Bhuk caught you`, score, last gate, pilgrimage list. Tap or Space runs again from full hunger / lane 0 / score 0.
- Home link still goes to `/`. `/cat-world` and `/dahi-handi` still work. No `localStorage` writes.

- [ ] **Step 7: Commit**

```bash
git add src/experiments/mushika-run/useMushikaRun.ts src/experiments/mushika-run/Overlays.tsx src/experiments/mushika-run/index.tsx public/assets/mushika-run README.md learningNotes/mushika-run.md docs/roadmap/README.md
git commit -m "$(cat <<'EOF'
feat: wire Mushika Run play loop, HUD, and audio

EOF
)"
```

---

## Self-review (spec coverage)

| Spec item | Task |
|---|---|
| `/mushika-run` listed on `/` | 1 |
| Cat World / Dahi Handi unchanged | 1, 7, 9 (no cat/dahi files except Canvas `dpr` optional) |
| 3-lane auto-run, swipe / tap jump | 4, 5, 9 |
| Procedural mesh Mushika | 8 |
| Recycled festive street tiles | 8 |
| Hunger + Bhuk only fail; no crash obstacles | 4, 8, 9 |
| Three modak kinds, points + hunger fills | 2, 3, 4, 8 |
| Five named gates, this-run list, no `localStorage` | 2, 4, 9 |
| Game over score / last gate / pilgrimage / restart | 4, 9 |
| Portrait HUD + safe-area | 9 |
| Keyboard fallback | 5 |
| Camera `(0, 2.4, 6.2)`, fov 50 / taller portrait, `dpr` ≤ 2 | 7, 8 |
| Spawn 20–40 m, ≥ 5 m from gates, one king / 80 m | 3, 4 |
| Collect radius 0.7; high needs `jumpT ∈ [0.30, 0.70]` | 4 |
| Drain 0.10/s × 1.15^gates, cap at 5 | 2, 4 |
| One `useFrame` clock; mesh does not collect | 4, 8, 9 |
| Experiment-local overlapping audio; missing mp3 skip | 6, 9 |
| Tab hide freezes + `stopAll` | 8 (`Tick` guard), 9 |
| Error boundary copy | 8, 9 |
| Off-ladder; shader-pond stays Next | 9 |
| Manual phone pass | 9 |
