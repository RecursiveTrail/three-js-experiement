# Dahi Handi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new `/dahi-handi` experiment where a stylized mesh Krishna runs under a hanging pot, jumps, smashes it with crack+clap, waits ~2 s on an empty ceiling, then a new pot appears elsewhere, endlessly.

**Architecture:** Pure `spawnPot` + `reduce` own the loop. A tiny overlapping Web Audio player plays `crack.mp3` and `clap.mp3` together on smash. R3F draws a dollhouse room, procedural Krishna, one live handi, and a shard burst. Space/click subscribe only while the route is visible. No Rapier, no Krishna GLB, Cat World untouched.

**Tech Stack:** React 19, Vite, TypeScript, `three`, `@react-three/fiber`, `@react-three/drei` (already in the app), `react-router-dom`, Vitest. No new packages.

**Spec:** `docs/superpowers/specs/2026-09-05-dahi-handi-design.md`

## Global Constraints

- No Next.js / SSR.
- No Rapier / colliders / miss timing.
- No Krishna GLB, Mixamo, or photoreal temple.
- No crowd meshes (the clap *is* the crowd).
- No background music loop.
- Do not reuse Cat World’s nudge families or `createAudioPlayer` (one-voice, typed to cat `SoundName`).
- Do not change Cat World, shared Canvas defaults (except passing a camera prop), or the GPU ladder order.
- Space or click always smashes; other keys do nothing.
- Key-held auto-repeat is ignored.
- Missing mp3: skip that shot, still smash visually.
- Tab away from `/dahi-handi`: stop listening and stop audio.
- Next pot appears **2.0 s after land** (`break` 0.6 s + `wait` 2.0 s).
- Do not commit macOS `._*` AppleDouble files.
- Push/fetch/pull: HTTPS + one-shot `gh` credential helper only (never `git push origin` over SSH).

## File structure

```
src/app/experiments.ts                          # add dahi-handi entry
src/app/experiments.test.ts                     # assert /dahi-handi
src/app/App.tsx                                 # Route
src/experiments/dahi-handi/constants.ts         # timings, colors, camera
src/experiments/dahi-handi/spawn.ts             # next pot XZ
src/experiments/dahi-handi/spawn.test.ts
src/experiments/dahi-handi/reduce.ts            # phase machine
src/experiments/dahi-handi/reduce.test.ts
src/experiments/dahi-handi/audio.ts             # overlapping one-shots
src/experiments/dahi-handi/audio.test.ts
src/experiments/dahi-handi/smashInput.ts        # Space + click
src/experiments/dahi-handi/smashInput.test.ts
src/experiments/dahi-handi/DahiBoundary.tsx
src/experiments/dahi-handi/Room.tsx
src/experiments/dahi-handi/Krishna.tsx
src/experiments/dahi-handi/Handi.tsx
src/experiments/dahi-handi/SmashBurst.tsx
src/experiments/dahi-handi/DahiHandi.tsx        # Canvas scene
src/experiments/dahi-handi/Overlays.tsx
src/experiments/dahi-handi/useDahiHandi.ts
src/experiments/dahi-handi/index.tsx
public/assets/dahi-handi/audio/crack.mp3
public/assets/dahi-handi/audio/clap.mp3
public/assets/dahi-handi/ATTRIBUTION.md
README.md
learningNotes/dahi-handi.md
```

Jump smash is the `jump` → `break` transition at apex: `JUMP_S = 0.275` (half of the spec’s 0.55 s hop). Descent and shards live in `break` (0.6 s). Then `wait` (2.0 s) with `pot === null`. Reducer `seq` bumps only on smash (audio). `animSeq` bumps when the phase actually changes (timeout restart). Setting `queued` must not bump `animSeq`.

---

### Task 1: Register `/dahi-handi`

**Files:**
- Modify: `src/app/experiments.ts`
- Modify: `src/app/experiments.test.ts`
- Modify: `src/app/App.tsx`
- Create: `src/experiments/dahi-handi/index.tsx`

**Interfaces:**
- Consumes: existing `Experiment` type and `ExperimentList` (reads `experiments`).
- Produces: `experiments` includes `{ id: 'dahi-handi', title: 'Dahi Handi', path: '/dahi-handi', description: 'Little Krishna jumps to smash hanging dahi handis.' }`. Route `/dahi-handi` renders `DahiHandiPage`.

- [ ] **Step 1: Write the failing registry test**

Add this case to `src/app/experiments.test.ts` (keep the Cat World test):

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
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/experiments.test.ts`

Expected: FAIL, `lists Dahi Handi at /dahi-handi` because the array has only Cat World.

- [ ] **Step 3: Register the experiment and stub page**

`src/app/experiments.ts` — add the second entry (do not remove Cat World):

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
]
```

Create `src/experiments/dahi-handi/index.tsx`:

```tsx
export function DahiHandiPage() {
  return (
    <div style={{ height: '100vh', width: '100vw', background: '#2b2118', color: '#f4e6c1', padding: 24 }}>
      Dahi Handi
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

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<ExperimentList />} />
        <Route path="/cat-world" element={<CatWorldPage />} />
        <Route path="/dahi-handi" element={<DahiHandiPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/experiments.test.ts`

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/experiments.ts src/app/experiments.test.ts src/app/App.tsx src/experiments/dahi-handi/index.tsx
git commit -m "$(cat <<'EOF'
feat: register Dahi Handi at /dahi-handi

EOF
)"
```

---

### Task 2: `spawnPot`

**Files:**
- Create: `src/experiments/dahi-handi/constants.ts`
- Create: `src/experiments/dahi-handi/spawn.ts`
- Create: `src/experiments/dahi-handi/spawn.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `spawnPot(avoid: [number, number], rng: () => number): [number, number]` and constants used by later tasks (`POT_SPAN`, `MIN_SEP`, `MAX_TRIES`, `POT_Y`, `ROPE_Y`, `APEX_OFFSET`, `JUMP_S`, `BREAK_S`, `WAIT_S`, `RUN_SPEED`, `RUN_MIN_S`, `RUN_MAX_S`, `CAMERA_POS`, `CAMERA_FOV`, `LOOK_AT`).

- [ ] **Step 1: Write the failing spawn tests**

Create `src/experiments/dahi-handi/spawn.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { MAX_TRIES, MIN_SEP, POT_SPAN } from './constants'
import { spawnPot } from './spawn'

function seqRng(values: number[]) {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]!
}

describe('spawnPot', () => {
  it('stays inside [-POT_SPAN, POT_SPAN] for X and Z', () => {
    const rng = seqRng([0, 1, 0.25, 0.75])
    const [x, z] = spawnPot([0, 0], rng)
    expect(x).toBeGreaterThanOrEqual(-POT_SPAN)
    expect(x).toBeLessThanOrEqual(POT_SPAN)
    expect(z).toBeGreaterThanOrEqual(-POT_SPAN)
    expect(z).toBeLessThanOrEqual(POT_SPAN)
  })

  it('retries until far enough from avoid', () => {
    const rng = seqRng([0.5, 0.5, 1, 1])
    const [x, z] = spawnPot([0, 0], rng)
    expect(Math.hypot(x, z)).toBeGreaterThanOrEqual(MIN_SEP)
    expect(x).toBeCloseTo(POT_SPAN)
    expect(z).toBeCloseTo(POT_SPAN)
  })

  it('keeps the last sample after MAX_TRIES', () => {
    const rng = seqRng(Array.from({ length: MAX_TRIES * 2 }, () => 0.5))
    const [x, z] = spawnPot([0, 0], rng)
    expect(x).toBeCloseTo(0)
    expect(z).toBeCloseTo(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/experiments/dahi-handi/spawn.test.ts`

Expected: FAIL with `Cannot find module './spawn'` (or `./constants`).

- [ ] **Step 3: Write constants and `spawnPot`**

Create `src/experiments/dahi-handi/constants.ts`:

```ts
export const POT_SPAN = 2.8
export const MIN_SEP = 1.6
export const MAX_TRIES = 12
export const POT_Y = 2.35
export const ROPE_Y = 3.0
export const APEX_OFFSET = 0.7
export const APEX_Y = POT_Y - APEX_OFFSET
export const JUMP_S = 0.275
export const BREAK_S = 0.6
export const WAIT_S = 2.0
export const RUN_SPEED = 5
export const RUN_MIN_S = 0.25
export const RUN_MAX_S = 0.8
export const CAMERA_POS: [number, number, number] = [0, 3.8, 8.5]
export const CAMERA_FOV = 40
export const LOOK_AT: [number, number, number] = [0, 1.1, 0]
export const SHARD_COUNT = 6
```

Create `src/experiments/dahi-handi/spawn.ts`:

```ts
import { MAX_TRIES, MIN_SEP, POT_SPAN } from './constants'

export type Xz = [number, number]

export function spawnPot(avoid: Xz, rng: () => number): Xz {
  let last: Xz = [0, 0]
  for (let i = 0; i < MAX_TRIES; i++) {
    const x = rng() * POT_SPAN * 2 - POT_SPAN
    const z = rng() * POT_SPAN * 2 - POT_SPAN
    last = [x, z]
    if (Math.hypot(x - avoid[0], z - avoid[1]) >= MIN_SEP) return last
  }
  return last
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/experiments/dahi-handi/spawn.test.ts`

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/experiments/dahi-handi/constants.ts src/experiments/dahi-handi/spawn.ts src/experiments/dahi-handi/spawn.test.ts
git commit -m "$(cat <<'EOF'
feat: spawn dahi handi pots away from the last smash

EOF
)"
```

---

### Task 3: Phase reducer

**Files:**
- Create: `src/experiments/dahi-handi/reduce.ts`
- Create: `src/experiments/dahi-handi/reduce.test.ts`

**Interfaces:**
- Consumes: `spawnPot`, `JUMP_S`, `BREAK_S`, `WAIT_S`, `RUN_SPEED`, `RUN_MIN_S`, `RUN_MAX_S`.
- Produces:

```ts
export type Phase = 'idle' | 'run' | 'jump' | 'break' | 'wait'
export type Vec3 = [number, number, number]
export type World = {
  phase: Phase
  krishna: Vec3
  yaw: number
  pot: [number, number] | null
  potId: number
  lastSmash: [number, number] | null
  smashCount: number
  queued: boolean
  seq: number
  animSeq: number
}
export type WorldEvent = { type: 'jump' } | { type: 'end' }
export function initialWorld(rng: () => number): World
export function reduce(state: World, event: WorldEvent, rng: () => number): World
export function phaseDurationS(state: World): number | null
export function runDurationS(from: [number, number], to: [number, number]): number
```

- [ ] **Step 1: Write the failing reducer tests**

Create `src/experiments/dahi-handi/reduce.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { POT_SPAN } from './constants'
import { initialWorld, phaseDurationS, reduce, type World } from './reduce'

function seqRng(values: number[]) {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]!
}

const far = seqRng([1, 1])

function withPot(at: [number, number], extra: Partial<World> = {}): World {
  return {
    phase: 'idle',
    krishna: [0, 0, 0],
    yaw: 0,
    pot: at,
    potId: 1,
    lastSmash: null,
    smashCount: 0,
    queued: false,
    seq: 0,
    animSeq: 0,
    ...extra,
  }
}

describe('reduce', () => {
  it('starts idle with a pot not on Krishna', () => {
    const w = initialWorld(far)
    expect(w.phase).toBe('idle')
    expect(w.pot).not.toBeNull()
    expect(Math.hypot(w.pot![0], w.pot![1])).toBeGreaterThanOrEqual(1.6)
    expect(w.smashCount).toBe(0)
    expect(w.potId).toBe(1)
  })

  it('idle + jump starts a run toward the pot', () => {
    const next = reduce(withPot([2, 0]), { type: 'jump' }, far)
    expect(next.phase).toBe('run')
    expect(next.queued).toBe(false)
    expect(next.yaw).toBeCloseTo(Math.atan2(2, 0))
    expect(next.animSeq).toBe(1)
  })

  it('jump during run only sets queued', () => {
    const running = reduce(withPot([2, 0]), { type: 'jump' }, far)
    const next = reduce(running, { type: 'jump' }, far)
    expect(next.phase).toBe('run')
    expect(next.queued).toBe(true)
    expect(next.animSeq).toBe(running.animSeq)
  })

  it('run end snaps under the pot and jumps', () => {
    const running = reduce(withPot([2, 0]), { type: 'jump' }, far)
    const next = reduce(running, { type: 'end' }, far)
    expect(next.phase).toBe('jump')
    expect(next.krishna).toEqual([2, 0, 0])
  })

  it('jump end smashes without bumping potId', () => {
    const jumping = reduce(reduce(withPot([2, 0]), { type: 'jump' }, far), { type: 'end' }, far)
    const next = reduce(jumping, { type: 'end' }, far)
    expect(next.phase).toBe('break')
    expect(next.pot).toBeNull()
    expect(next.smashCount).toBe(1)
    expect(next.seq).toBe(1)
    expect(next.potId).toBe(1)
    expect(next.lastSmash).toEqual([2, 0])
  })

  it('break end goes to wait with pot still null', () => {
    let w = withPot([2, 0])
    w = reduce(w, { type: 'jump' }, far)
    w = reduce(w, { type: 'end' }, far)
    w = reduce(w, { type: 'end' }, far)
    w = reduce(w, { type: 'end' }, far)
    expect(w.phase).toBe('wait')
    expect(w.pot).toBeNull()
    expect(w.potId).toBe(1)
  })

  it('wait end without queue spawns a new pot and idles', () => {
    let w = withPot([2, 0])
    w = reduce(w, { type: 'jump' }, far)
    w = reduce(w, { type: 'end' }, far)
    w = reduce(w, { type: 'end' }, far)
    w = reduce(w, { type: 'end' }, far)
    const next = reduce(w, { type: 'end' }, seqRng([0, 0, 0, 1]))
    expect(next.phase).toBe('idle')
    expect(next.pot).not.toBeNull()
    expect(next.potId).toBe(2)
    expect(next.queued).toBe(false)
    expect(Math.hypot(next.pot![0] - 2, next.pot![1] - 0)).toBeGreaterThanOrEqual(1.6)
  })

  it('wait end with queue runs at the new pot', () => {
    let w = withPot([2, 0])
    w = reduce(w, { type: 'jump' }, far)
    w = reduce(w, { type: 'end' }, far)
    w = reduce(w, { type: 'end' }, far)
    w = reduce(w, { type: 'end' }, far)
    w = reduce(w, { type: 'jump' }, far)
    expect(w.queued).toBe(true)
    const next = reduce(w, { type: 'end' }, seqRng([0, 1]))
    expect(next.phase).toBe('run')
    expect(next.queued).toBe(false)
    expect(next.pot).not.toBeNull()
    expect(next.potId).toBe(2)
  })

  it('phaseDurationS is null while idle', () => {
    expect(phaseDurationS(withPot([1, 1]))).toBeNull()
  })

  it('clamps run duration', () => {
    const running = reduce(withPot([POT_SPAN, POT_SPAN]), { type: 'jump' }, far)
    const d = phaseDurationS(running)
    expect(d).toBeGreaterThanOrEqual(0.25)
    expect(d).toBeLessThanOrEqual(0.8)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/experiments/dahi-handi/reduce.test.ts`

Expected: FAIL with `Cannot find module './reduce'`.

- [ ] **Step 3: Write the reducer**

Create `src/experiments/dahi-handi/reduce.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/experiments/dahi-handi/reduce.test.ts`

Expected: PASS (10 tests). If `wait end without queue` fails because `seqRng([0, 0, 0, 1])` still lands too close, change that test’s rng to `[0, 1]` (maps to `x=-2.8`, `z=2.8`) which is ≥ 1.6 m from `[2, 0]`. Do not weaken `MIN_SEP`.

- [ ] **Step 5: Commit**

```bash
git add src/experiments/dahi-handi/reduce.ts src/experiments/dahi-handi/reduce.test.ts
git commit -m "$(cat <<'EOF'
feat: drive dahi handi smash, wait, and respawn in a reducer

EOF
)"
```

---

### Task 4: Overlapping smash audio

**Files:**
- Create: `src/experiments/dahi-handi/audio.ts`
- Create: `src/experiments/dahi-handi/audio.test.ts`

**Interfaces:**
- Consumes: nothing from Cat World audio.
- Produces:

```ts
export type SmashSound = 'crack' | 'clap'
export type SmashPlayer = {
  playSmash(): Promise<void>
  stopAll(): void
  dispose(): void
}
export function createSmashPlayer(opts: {
  basePath: string
  fetchImpl?: typeof fetch
  decode?: (ctx: AudioContext, buf: ArrayBuffer) => Promise<AudioBuffer>
  context?: AudioContext
}): SmashPlayer
```

`playSmash` starts **both** `crack` and `clap` without stopping the other. `stopAll` stops every live source. Missing files skip. Do not import `src/shared/audio/player.ts`.

- [ ] **Step 1: Write the failing audio tests**

Create `src/experiments/dahi-handi/audio.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { createSmashPlayer } from './audio'

function mockContext() {
  const started: string[] = []
  const stopped: string[] = []
  const sources: { stop: () => void }[] = []
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
      sources.push(src)
      return src
    },
    createGain() {
      return { gain: { value: 1 }, connect: vi.fn() }
    },
    destination: {},
  }
  return { ctx: ctx as unknown as AudioContext, started, stopped, sources }
}

describe('createSmashPlayer', () => {
  it('starts crack and clap without stopping the first', async () => {
    const { ctx, started, stopped } = mockContext()
    const player = createSmashPlayer({
      basePath: '/assets/dahi-handi/audio',
      context: ctx,
      fetchImpl: (async () => new Response(new ArrayBuffer(8))) as typeof fetch,
      decode: async () => ({ duration: 1 }) as AudioBuffer,
    })
    await player.playSmash()
    expect(started).toHaveLength(2)
    expect(stopped).toHaveLength(0)
    player.dispose()
  })

  it('resolves when a file is missing', async () => {
    const { ctx } = mockContext()
    const player = createSmashPlayer({
      basePath: '/assets/dahi-handi/audio',
      context: ctx,
      fetchImpl: (async () => {
        throw new Error('404')
      }) as typeof fetch,
    })
    await expect(player.playSmash()).resolves.toBeUndefined()
    player.dispose()
  })

  it('stopAll stops live sources', async () => {
    const { ctx, stopped } = mockContext()
    const player = createSmashPlayer({
      basePath: '/assets/dahi-handi/audio',
      context: ctx,
      fetchImpl: (async () => new Response(new ArrayBuffer(8))) as typeof fetch,
      decode: async () => ({ duration: 1 }) as AudioBuffer,
    })
    await player.playSmash()
    player.stopAll()
    expect(stopped.length).toBeGreaterThanOrEqual(2)
    player.dispose()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/experiments/dahi-handi/audio.test.ts`

Expected: FAIL with `Cannot find module './audio'`.

- [ ] **Step 3: Write the overlapping player**

Create `src/experiments/dahi-handi/audio.ts`:

```ts
export type SmashSound = 'crack' | 'clap'

type Source = { stop: () => void; disconnect: () => void }

export type SmashPlayer = {
  playSmash(): Promise<void>
  stopAll(): void
  dispose(): void
}

const NAMES: SmashSound[] = ['crack', 'clap']

export function createSmashPlayer(opts: {
  basePath: string
  fetchImpl?: typeof fetch
  decode?: (ctx: AudioContext, buf: ArrayBuffer) => Promise<AudioBuffer>
  context?: AudioContext
}): SmashPlayer {
  const fetchImpl = opts.fetchImpl ?? fetch
  const ownsContext = opts.context === undefined
  let ctx = opts.context
  let generation = 0
  const live = new Set<Source>()
  const cache = new Map<SmashSound, AudioBuffer>()

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

  async function playOne(name: SmashSound, playGen: number): Promise<void> {
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
    async playSmash() {
      const playGen = generation
      await Promise.all(NAMES.map((name) => playOne(name, playGen)))
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

Run: `npx vitest run src/experiments/dahi-handi/audio.test.ts`

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/experiments/dahi-handi/audio.ts src/experiments/dahi-handi/audio.test.ts
git commit -m "$(cat <<'EOF'
feat: play dahi handi crack and clap together

EOF
)"
```

---

### Task 5: Space and click input

**Files:**
- Create: `src/experiments/dahi-handi/smashInput.ts`
- Create: `src/experiments/dahi-handi/smashInput.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:

```ts
export function subscribeSmashInput(
  windowTarget: Window,
  root: HTMLElement,
  onJump: () => void,
  isActive: () => boolean,
): () => void
```

Space `keydown` (no repeat) and `pointerdown` on `root` call `onJump` when `isActive()`. Ignore other keys. If the pointer target is inside an `a`, skip (home link). `preventDefault` on Space.

- [ ] **Step 1: Write the failing input tests**

Create `src/experiments/dahi-handi/smashInput.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { subscribeSmashInput } from './smashInput'

describe('subscribeSmashInput', () => {
  it('fires on Space and pointerdown, ignores repeat and other keys', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const seen: string[] = []
    const stop = subscribeSmashInput(window, root, () => seen.push('j'), () => true)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true }))
    root.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(seen).toEqual(['j', 'j'])
    stop()
    root.remove()
  })

  it('does not fire when inactive or when clicking a link', () => {
    const root = document.createElement('div')
    const link = document.createElement('a')
    link.href = '/'
    root.appendChild(link)
    document.body.appendChild(root)
    const seen: string[] = []
    let active = false
    const stop = subscribeSmashInput(window, root, () => seen.push('j'), () => active)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    active = true
    link.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(seen).toHaveLength(0)
    stop()
    root.remove()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/experiments/dahi-handi/smashInput.test.ts`

Expected: FAIL with `Cannot find module './smashInput'`.

- [ ] **Step 3: Write the subscriber**

Create `src/experiments/dahi-handi/smashInput.ts`:

```ts
export function subscribeSmashInput(
  windowTarget: Window,
  root: HTMLElement,
  onJump: () => void,
  isActive: () => boolean,
): () => void {
  const onKey = (event: KeyboardEvent) => {
    if (event.repeat) return
    if (!isActive()) return
    if (event.key !== ' ') return
    event.preventDefault()
    onJump()
  }
  const onPointer = (event: PointerEvent) => {
    if (!isActive()) return
    const t = event.target
    if (t instanceof Element && t.closest('a')) return
    onJump()
  }
  windowTarget.addEventListener('keydown', onKey)
  root.addEventListener('pointerdown', onPointer)
  return () => {
    windowTarget.removeEventListener('keydown', onKey)
    root.removeEventListener('pointerdown', onPointer)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/experiments/dahi-handi/smashInput.test.ts`

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/experiments/dahi-handi/smashInput.ts src/experiments/dahi-handi/smashInput.test.ts
git commit -m "$(cat <<'EOF'
feat: smash dahi handis on Space or click

EOF
)"
```

---

### Task 6: Room, Krishna, handi, burst

**Files:**
- Create: `src/experiments/dahi-handi/DahiBoundary.tsx`
- Create: `src/experiments/dahi-handi/Room.tsx`
- Create: `src/experiments/dahi-handi/Krishna.tsx`
- Create: `src/experiments/dahi-handi/Handi.tsx`
- Create: `src/experiments/dahi-handi/SmashBurst.tsx`
- Create: `src/experiments/dahi-handi/DahiHandi.tsx`

**Interfaces:**
- Consumes: `World`, `phaseDurationS` from `reduce.ts`; `APEX_Y`, `POT_Y`, `ROPE_Y`, `CAMERA_POS`, `CAMERA_FOV`, `LOOK_AT`, `SHARD_COUNT` from `constants.ts`.
- Produces: `DahiHandi({ world }: { world: World })` renders the full scene. Krishna origin at the feet. No +Z wall. Live `Handi` only when `world.pot` is set. `SmashBurst` only during `phase === 'break'` at `lastSmash`.

No unit tests for meshes. After this task the page is still the stub until Task 7.

- [ ] **Step 1: Add the error boundary and room**

Create `src/experiments/dahi-handi/DahiBoundary.tsx`:

```tsx
import { Component, type ReactNode } from 'react'

export class DahiBoundary extends Component<
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

Create `src/experiments/dahi-handi/Room.tsx`:

```tsx
import { DoubleSide } from 'three'

export function Room() {
  const h = 3.2
  const half = 4
  const wall = '#e8d5b7'
  const wood = '#6b3f24'
  const floor = '#c4a574'
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[half * 2, half * 2]} />
        <meshStandardMaterial color={floor} />
      </mesh>
      <mesh position={[0, h / 2, -half]} receiveShadow>
        <planeGeometry args={[half * 2, h]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <mesh position={[-half, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[half * 2, h]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <mesh position={[half, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[half * 2, h]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <mesh position={[0, 3.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[half * 2, half * 2]} />
        <meshStandardMaterial color="#d9c4a0" side={DoubleSide} />
      </mesh>
      {[-2, 0, 2].map((x) => (
        <mesh key={x} position={[x, 3.05, 0]}>
          <boxGeometry args={[0.18, 0.12, 7.6]} />
          <meshStandardMaterial color={wood} />
        </mesh>
      ))}
      <pointLight position={[-1.6, 2.6, 0.4]} intensity={12} color="#ffd9a0" distance={9} castShadow />
      <pointLight position={[1.8, 2.6, -0.6]} intensity={8} color="#ffcc88" distance={9} />
      <ambientLight intensity={0.35} />
    </group>
  )
}
```

- [ ] **Step 2: Add Krishna, handi, and shards**

Create `src/experiments/dahi-handi/Krishna.tsx`:

```tsx
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { APEX_Y } from './constants'
import { phaseDurationS, type World } from './reduce'
import type { Group } from 'three'

export function Krishna({ world }: { world: World }) {
  const ref = useRef<Group>(null)
  const started = useRef(0)
  useEffect(() => {
    started.current = performance.now()
  }, [world.animSeq])

  useFrame(() => {
    const g = ref.current
    if (!g) return
    const duration = phaseDurationS(world)
    const u = duration ? Math.min(1, (performance.now() - started.current) / (duration * 1000)) : 0
    let x = world.krishna[0]
    let y = 0
    let z = world.krishna[2]
    if (world.phase === 'run' && world.pot) {
      x = world.krishna[0] + (world.pot[0] - world.krishna[0]) * u
      z = world.krishna[2] + (world.pot[1] - world.krishna[2]) * u
      y = Math.abs(Math.sin(u * Math.PI * 4)) * 0.06
    } else if (world.phase === 'jump') {
      y = APEX_Y * Math.sin((Math.PI / 2) * u)
    } else if (world.phase === 'break') {
      y = APEX_Y * (1 - u)
    }
    g.position.set(x, y, z)
    g.rotation.y = world.yaw
    const stretch = world.phase === 'jump' ? 1.08 : 1
    g.scale.set(1, stretch, 1)
  })

  return (
    <group ref={ref} position={world.krishna} rotation={[0, world.yaw, 0]} castShadow>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.28, 10]} />
        <meshStandardMaterial color="#3d6bb3" />
      </mesh>
      <mesh position={[0, 0.08, 0.02]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.2, 0.28, 10]} />
        <meshStandardMaterial color="#e4c441" />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#3d6bb3" />
      </mesh>
      <mesh position={[0, 0.64, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#1a120c" />
      </mesh>
      <mesh position={[0.02, 0.78, -0.02]} rotation={[0.4, 0.2, 0.3]}>
        <coneGeometry args={[0.03, 0.22, 6]} />
        <meshStandardMaterial color="#2f8f4e" />
      </mesh>
      <mesh position={[0, 0.38, -0.12]} rotation={[1.2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.28, 8]} />
        <meshStandardMaterial color="#b08948" />
      </mesh>
    </group>
  )
}
```

Create `src/experiments/dahi-handi/Handi.tsx`:

```tsx
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { POT_Y, ROPE_Y } from './constants'
import type { Group } from 'three'

export function Handi({ xz }: { xz: [number, number] }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.4) * 0.06
  })
  return (
    <group position={[xz[0], 0, xz[1]]}>
      <mesh position={[0, (ROPE_Y + POT_Y + 0.18) / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, ROPE_Y - (POT_Y + 0.18), 6]} />
        <meshStandardMaterial color="#5c4030" />
      </mesh>
      <group ref={ref} position={[0, POT_Y, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#c4713b" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.1, 12]} />
          <meshStandardMaterial color="#b56534" />
        </mesh>
      </group>
    </group>
  )
}
```

Create `src/experiments/dahi-handi/SmashBurst.tsx`:

```tsx
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { BREAK_S, POT_Y, SHARD_COUNT } from './constants'
import type { Group } from 'three'

const OFFSETS: [number, number, number][] = [
  [0.12, 0, 0.05],
  [-0.1, 0.04, 0.08],
  [0.04, -0.02, -0.12],
  [-0.08, 0.02, -0.06],
  [0.09, 0.06, -0.04],
  [0, 0.08, 0.1],
]

export function SmashBurst({ xz, animSeq }: { xz: [number, number]; animSeq: number }) {
  const ref = useRef<Group>(null)
  const started = useRef(0)
  useEffect(() => {
    started.current = performance.now()
  }, [animSeq])
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const u = Math.min(1, (performance.now() - started.current) / (BREAK_S * 1000))
    g.position.y = POT_Y - u * 1.4
    g.rotation.z = u * 0.8
    g.scale.setScalar(1 - u * 0.3)
  })
  return (
    <group ref={ref} position={[xz[0], POT_Y, xz[1]]}>
      {OFFSETS.slice(0, SHARD_COUNT).map((o, i) => (
        <mesh key={i} position={o} castShadow>
          <boxGeometry args={[0.07, 0.05, 0.06]} />
          <meshStandardMaterial color="#c4713b" />
        </mesh>
      ))}
    </group>
  )
}
```

- [ ] **Step 3: Compose the canvas scene**

Create `src/experiments/dahi-handi/DahiHandi.tsx`:

```tsx
import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { ExperienceCanvas } from '../../shared/r3f/ExperienceCanvas'
import { CAMERA_FOV, CAMERA_POS, LOOK_AT } from './constants'
import { Handi } from './Handi'
import { Krishna } from './Krishna'
import { Room } from './Room'
import { SmashBurst } from './SmashBurst'
import type { World } from './reduce'

function CameraRig() {
  const { camera } = useThree()
  useLayoutEffect(() => {
    camera.lookAt(...LOOK_AT)
  }, [camera])
  return null
}

export function DahiHandi({ world }: { world: World }) {
  return (
    <ExperienceCanvas camera={{ position: CAMERA_POS, fov: CAMERA_FOV }}>
      <CameraRig />
      <Room />
      <Krishna world={world} />
      {world.pot ? <Handi xz={world.pot} /> : null}
      {world.phase === 'break' && world.lastSmash ? (
        <SmashBurst xz={world.lastSmash} animSeq={world.animSeq} />
      ) : null}
    </ExperienceCanvas>
  )
}
```

- [ ] **Step 4: Typecheck the new files**

Run: `npx tsc -b --pretty false`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/experiments/dahi-handi/DahiBoundary.tsx src/experiments/dahi-handi/Room.tsx src/experiments/dahi-handi/Krishna.tsx src/experiments/dahi-handi/Handi.tsx src/experiments/dahi-handi/SmashBurst.tsx src/experiments/dahi-handi/DahiHandi.tsx
git commit -m "$(cat <<'EOF'
feat: model the dahi handi room, Krishna, pot, and shards

EOF
)"
```

---

### Task 7: Hook, page, sounds, docs

**Files:**
- Create: `src/experiments/dahi-handi/useDahiHandi.ts`
- Create: `src/experiments/dahi-handi/Overlays.tsx`
- Modify: `src/experiments/dahi-handi/index.tsx`
- Create: `public/assets/dahi-handi/audio/crack.mp3`
- Create: `public/assets/dahi-handi/audio/clap.mp3`
- Create: `public/assets/dahi-handi/ATTRIBUTION.md`
- Modify: `README.md`
- Create: `learningNotes/dahi-handi.md`

**Interfaces:**
- Consumes: `initialWorld`, `reduce`, `phaseDurationS`, `createSmashPlayer`, `subscribeSmashInput`, `DahiHandi`, `DahiBoundary`.
- Produces: a playable `/dahi-handi` page. `useDahiHandi` returns `{ world }`. Overlay copy: “Space or click — smash the handi” and “N handis”.

- [ ] **Step 1: Download CC0 audio and write attribution**

```bash
mkdir -p public/assets/dahi-handi/audio
curl -L -A "Mozilla/5.0" -o public/assets/dahi-handi/audio/crack.mp3 "https://bigsoundbank.com/UPLOAD/mp3/1643.mp3"
curl -L -A "Mozilla/5.0" -o public/assets/dahi-handi/audio/clap.mp3 "https://bigsoundbank.com/UPLOAD/mp3/2363.mp3"
file public/assets/dahi-handi/audio/crack.mp3 public/assets/dahi-handi/audio/clap.mp3
```

Expected: both files are MPEG/Audio (or “Audio file”), not HTML. If a download is HTML, open the attribution page and use the MP3 link from the Download row instead:

- crack: [Broken Plate #1](https://bigsoundbank.com/broken-plate-1-s1643.html) (#1643)
- clap: [Applause #1](https://bigsoundbank.com/applause-1-s2363.html) (#2363), ~8 s indoor clap

Create `public/assets/dahi-handi/ATTRIBUTION.md`:

```md
# Dahi Handi asset licenses

All bundled third-party files are CC0 (public domain). Attribution is not required; listed here so we remember the source.

## BigSoundBank (CC0)

https://bigsoundbank.com — Joseph Sardin / Dorian Clair.

| File | Source | Notes |
|---|---|---|
| `audio/crack.mp3` | [Broken Plate #1](https://bigsoundbank.com/broken-plate-1-s1643.html) (#1643) | Ceramic break, ~2s, Joseph Sardin |
| `audio/clap.mp3` | [Applause #1](https://bigsoundbank.com/applause-1-s2363.html) (#2363) | Indoor clap, ~8s, Dorian Clair |
```

Do not add `._*` files.

- [ ] **Step 2: Write the hook, overlays, and page**

Create `src/experiments/dahi-handi/useDahiHandi.ts`:

```ts
import { useEffect, useMemo, useReducer, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { assetUrl } from '../../shared/assetUrl'
import { createSmashPlayer } from './audio'
import { initialWorld, phaseDurationS, reduce, type WorldEvent } from './reduce'
import { subscribeSmashInput } from './smashInput'

export function useDahiHandi() {
  const [world, dispatch] = useReducer(
    (s: ReturnType<typeof initialWorld>, ev: WorldEvent) => reduce(s, ev, Math.random),
    undefined,
    () => initialWorld(Math.random),
  )
  const location = useLocation()
  const rootRef = useRef<HTMLDivElement>(null)
  const player = useMemo(
    () => createSmashPlayer({ basePath: assetUrl('assets/dahi-handi/audio') }),
    [],
  )

  useEffect(() => {
    if (world.seq === 0) return
    void player.playSmash()
  }, [world.seq, player])

  useEffect(() => {
    const ms = phaseDurationS(world)
    if (ms === null) return
    const t = window.setTimeout(() => dispatch({ type: 'end' }), ms * 1000)
    return () => window.clearTimeout(t)
  }, [world.animSeq, world.phase])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const stop = subscribeSmashInput(
      window,
      root,
      () => dispatch({ type: 'jump' }),
      () => document.visibilityState === 'visible' && location.pathname === '/dahi-handi',
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

  return { world, rootRef }
}
```

Create `src/experiments/dahi-handi/Overlays.tsx`:

```tsx
import { Link } from 'react-router-dom'

export function Overlays({ smashCount }: { smashCount: number }) {
  const label = smashCount === 1 ? '1 handi' : `${smashCount} handis`
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        textShadow: '0 2px 8px #000',
      }}
    >
      <div style={{ pointerEvents: 'auto', padding: 16 }}>
        <Link to="/" style={{ color: '#fff' }}>
          All experiments
        </Link>
      </div>
      <div style={{ position: 'absolute', left: 16, bottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Space or click — smash the handi</div>
        <div style={{ fontSize: 20, marginTop: 8 }}>{label}</div>
      </div>
    </div>
  )
}
```

Replace `src/experiments/dahi-handi/index.tsx`:

```tsx
import { DahiBoundary } from './DahiBoundary'
import { DahiHandi } from './DahiHandi'
import { Overlays } from './Overlays'
import { useDahiHandi } from './useDahiHandi'

export function DahiHandiPage() {
  const { world, rootRef } = useDahiHandi()
  return (
    <div ref={rootRef} style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <DahiBoundary
        fallback={<div style={{ padding: 24, color: '#f4e6c1' }}>The room could not load. Try refresh.</div>}
      >
        <DahiHandi world={world} />
      </DahiBoundary>
      <Overlays smashCount={world.smashCount} />
    </div>
  )
}
```

The `useEffect` that calls `player.dispose()` on pathname change must not dispose on every `world` update. Keep the dependency list `[player, location.pathname]` as written. `player` is memoized empty-deps.

- [ ] **Step 3: Docs**

Add a Dahi Handi section to `README.md` after the Cat World bullet list (keep Cat World as-is):

```md
- `/` — experiment list
- `/cat-world` — backyard cat. Mash the keyboard.
- `/dahi-handi` — little Krishna smashes hanging dahi handis.
```

And after the Cat World section:

```md
## Dahi Handi

Stylized mesh Krishna in a dollhouse room.

- Space or click: run under the pot, jump, always smash.
- Crack + clap on smash, then ~2 s of empty ceiling, then a new pot elsewhere.
- Count stays on screen.

Assets: `public/assets/dahi-handi`. Licenses: `public/assets/dahi-handi/ATTRIBUTION.md`.
```

Leave the Roadmap paragraph pointing at shader-pond; this experiment is off-ladder on purpose.

Create `learningNotes/dahi-handi.md`:

```md
# Dahi Handi

Jump height is authored, not simulated. The reducer only stores feet XZ; `Krishna` eases Y in `useFrame` (`sin` on the way up, linear on the way down). Smash is the `jump` → `break` transition at apex so a pure `{ jump | end }` machine does not need a mid-clip event.

The next pot waits on `wait` with `pot === null`. That gap is product, not a loading state.

Crack and clap must overlap. Cat World’s player stops the previous voice, so this scene has its own `createSmashPlayer`.
```

- [ ] **Step 4: Run the full unit suite**

Run: `npx vitest run`

Expected: all existing Cat World tests still PASS, plus dahi-handi tests.

Run: `npx tsc -b --pretty false`

Expected: exit 0.

- [ ] **Step 5: Browser check**

`npm run dev` is often already running. Open `/dahi-handi`.

Confirm:

- Home list shows Dahi Handi.
- Room is a dollhouse (no near wall), warm lamps, Krishna readable as a small blue child with yellow dhoti and feather.
- One hanging pot. Space or click: he runs under it, jumps, pot vanishes, shards fall, crack+clap.
- ~2 s empty ceiling, then a new pot at a different spot.
- Count goes 0 → 1 → 2. Mashing Space during the wait still smashes the next pot (one queued).
- Other keys do nothing. `/cat-world` still works.

If Krishna’s feet clip the floor, lower dhoti/cylinder Y in `Krishna.tsx` until they sit on y=0. If the pot is inside a wall, you shipped the wrong `POT_SPAN` — do not change spawn tests to hide it.

- [ ] **Step 6: Commit**

```bash
git add src/experiments/dahi-handi/useDahiHandi.ts src/experiments/dahi-handi/Overlays.tsx src/experiments/dahi-handi/index.tsx public/assets/dahi-handi README.md learningNotes/dahi-handi.md
git commit -m "$(cat <<'EOF'
feat: wire dahi handi play loop, sounds, and overlays

EOF
)"
```

---

## Self-review (spec coverage)

| Spec item | Task |
|---|---|
| `/dahi-handi` on `/` | 1 |
| Cat World unchanged | 1, 7 (no cat files) |
| Mesh Krishna | 6 |
| Indoor dollhouse, no +Z wall | 6 |
| Space/click always smash | 5, 7 |
| One-slot queue | 3 |
| Crack + clap overlap | 4, 7 |
| Pot gone on smash; 2 s wait; new XZ | 3, 6, 7 |
| Smash count overlay | 7 |
| Fixed camera | 6 |
| Animation-driven, no Rapier | 3, 6 |
| Missing mp3 skip | 4 |
| Tab away stops audio/input | 7 |
| Spawn inset + min separation | 2 |
| Error boundary copy | 6, 7 |
| `ATTRIBUTION.md` | 7 |
| Manual pass | 7 |
