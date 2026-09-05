# Cat World Direct Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WASD/arrows always walk a short burst the way the key points, Space always jumps, unreserved keys keep surprise reactions, and walk/jump no longer play human grass footsteps.

**Architecture:** `commandFromKey` sits next to `familyFromKey` and intercepts reserved keys before the weighted picker. World state gains `facing` and `moveMode`. `RiggedCat` translates along `facing` only for `'step'`; figure-eight stays on `'wander'`. `clipMap` remains the only clip+sound table.

**Tech Stack:** React 19, Vite, TypeScript, `three`, `@react-three/fiber`, `@react-three/drei`, Vitest. No new npm packages.

**Spec:** `docs/superpowers/specs/2026-09-05-cat-world-direct-controls-design.md`

## Global Constraints

- No Next.js / SSR.
- No Rapier / physics.
- No orbit-drag camera.
- Never play the `Death` clip. Never play `Jump_Loop`.
- Hold-to-steer is out of scope; movement is tap-to-step.
- `A` is **left**, not meow. Meows stay on `E I O U` and other unreserved keys.
- Reserved keys (WASD, arrows, Space) **never** roll ignore or a random other action.
- `Enter` stays on the old jump family (weighted pick). Only Space is a sure jump.
- Key-held auto-repeat is ignored (existing nudge bus).
- Missing `cat.glb` → capsule placeholder; missing clip → `Idle` + sound; missing audio → skip, no crash.
- Tab away from `/cat-world` → stop listening, stop voice.
- No new npm packages.
- Do not commit macOS `._*` AppleDouble files.
- Do not change the yard, camera follow math, facts overlay layout, or Pages deploy.
- Planning search found **no** free already-rigged house-cat GLB with both Walk (or equivalent) and a jump clip under CC0/CC-BY. Default look path is Quaternius proportion tweaks. If a qualifying GLB is found in a 15-minute re-search, swap the file and remap `clipMap` names only.

## File structure

```
src/shared/input/commandFromKey.ts          # NEW: reserved vs nudge mapper
src/shared/input/commandFromKey.test.ts     # NEW
src/shared/input/families.ts                # unchanged (A remains voice at this layer)
src/experiments/cat-world/idleLife.ts       # add step/jump helpers + durations
src/experiments/cat-world/idleLife.test.ts
src/experiments/cat-world/nudgeReduce.ts    # facing, moveMode, reserved interrupt
src/experiments/cat-world/nudgeReduce.test.ts
src/experiments/cat-world/clipMap.ts        # unbind paw/land
src/experiments/cat-world/clipMap.test.ts
src/experiments/cat-world/CatActor.tsx      # yaw + step lerp vs wander figure-eight
src/experiments/cat-world/CatWorld.tsx      # pass facing + moveMode
src/experiments/cat-world/useCatWorld.ts    # 0.8s reserved walk timeout
src/experiments/cat-world/index.tsx         # pass new props
README.md
public/assets/cat-world/ATTRIBUTION.md
public/assets/cat-world/audio/paw.mp3       # delete once unused
public/assets/cat-world/audio/land.mp3      # delete once unused
```

`familyFromKey` stays as-is. `commandFromKey` is the product mapper and runs first.

---

### Task 1: commandFromKey

**Files:**
- Create: `src/shared/input/commandFromKey.ts`
- Test: `src/shared/input/commandFromKey.test.ts`

**Interfaces:**
- Consumes: `familyFromKey`, `KeyFamily` from `src/shared/input/families.ts`
- Produces:
  - `export type StepDir = [number, number, number]`
  - `export type Command = { type: 'step'; dir: StepDir } | { type: 'jump' } | { type: 'nudge'; family: KeyFamily }`
  - `export function commandFromKey(key: string): Command`
  - `key` is `KeyboardEvent.key`. Single-letter keys are compared case-insensitively.
  - Screen mapping (camera at `(cat.x, cat.y + 1.1, cat.z + 4.2)` looking at the cat):

| Key | `dir` |
|---|---|
| `W` / `ArrowUp` | `[0, 0, -1]` |
| `S` / `ArrowDown` | `[0, 0, +1]` |
| `A` / `ArrowLeft` | `[-1, 0, 0]` |
| `D` / `ArrowRight` | `[+1, 0, 0]` |
| ` ` (Space) | `{ type: 'jump' }` |

- [ ] **Step 1: Write the failing test**

Create `src/shared/input/commandFromKey.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { commandFromKey } from './commandFromKey'

describe('commandFromKey', () => {
  it('maps A to step left, not voice', () => {
    expect(commandFromKey('a')).toEqual({ type: 'step', dir: [-1, 0, 0] })
    expect(commandFromKey('A')).toEqual({ type: 'step', dir: [-1, 0, 0] })
  })

  it('maps WASD and arrows to matching steps', () => {
    expect(commandFromKey('w')).toEqual({ type: 'step', dir: [0, 0, -1] })
    expect(commandFromKey('W')).toEqual({ type: 'step', dir: [0, 0, -1] })
    expect(commandFromKey('ArrowUp')).toEqual({ type: 'step', dir: [0, 0, -1] })
    expect(commandFromKey('s')).toEqual({ type: 'step', dir: [0, 0, 1] })
    expect(commandFromKey('ArrowDown')).toEqual({ type: 'step', dir: [0, 0, 1] })
    expect(commandFromKey('d')).toEqual({ type: 'step', dir: [1, 0, 0] })
    expect(commandFromKey('ArrowRight')).toEqual({ type: 'step', dir: [1, 0, 0] })
    expect(commandFromKey('ArrowLeft')).toEqual({ type: 'step', dir: [-1, 0, 0] })
  })

  it('maps Space to jump', () => {
    expect(commandFromKey(' ')).toEqual({ type: 'jump' })
  })

  it('maps E to a voice nudge, not a step', () => {
    expect(commandFromKey('e')).toEqual({ type: 'nudge', family: 'voice' })
    expect(commandFromKey('E')).toEqual({ type: 'nudge', family: 'voice' })
  })

  it('leaves Enter on the jump family nudge', () => {
    expect(commandFromKey('Enter')).toEqual({ type: 'nudge', family: 'jump' })
  })

  it('never returns a nudge for reserved keys', () => {
    for (const key of ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']) {
      expect(commandFromKey(key).type).not.toBe('nudge')
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/shared/input/commandFromKey.test.ts
```

Expected: FAIL with `Cannot find module './commandFromKey'`.

- [ ] **Step 3: Write minimal implementation**

Create `src/shared/input/commandFromKey.ts`:

```ts
import { familyFromKey, type KeyFamily } from './families'

export type StepDir = [number, number, number]

export type Command =
  | { type: 'step'; dir: StepDir }
  | { type: 'jump' }
  | { type: 'nudge'; family: KeyFamily }

const UP: StepDir = [0, 0, -1]
const DOWN: StepDir = [0, 0, 1]
const LEFT: StepDir = [-1, 0, 0]
const RIGHT: StepDir = [1, 0, 0]

export function commandFromKey(key: string): Command {
  const k = key.length === 1 ? key.toLowerCase() : key
  if (k === 'w' || k === 'ArrowUp') return { type: 'step', dir: UP }
  if (k === 's' || k === 'ArrowDown') return { type: 'step', dir: DOWN }
  if (k === 'a' || k === 'ArrowLeft') return { type: 'step', dir: LEFT }
  if (k === 'd' || k === 'ArrowRight') return { type: 'step', dir: RIGHT }
  if (k === ' ') return { type: 'jump' }
  return { type: 'nudge', family: familyFromKey(key) }
}
```

Do not change `familyFromKey`. `A` remains `'voice'` at that layer; this function intercepts first.

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/shared/input/commandFromKey.test.ts
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/input/commandFromKey.ts src/shared/input/commandFromKey.test.ts
git commit -m "$(cat <<'EOF'
feat: map WASD, arrows, and Space to reserved cat commands

EOF
)"
```

---

### Task 2: Unbind human grass footsteps

**Files:**
- Modify: `src/experiments/cat-world/clipMap.ts`
- Modify: `src/experiments/cat-world/clipMap.test.ts`
- Modify: `public/assets/cat-world/ATTRIBUTION.md`
- Delete: `public/assets/cat-world/audio/paw.mp3`, `public/assets/cat-world/audio/land.mp3` (and any `._paw.mp3` / `._land.mp3`)

**Interfaces:**
- Consumes: `LogicalAction` from `src/experiments/cat-world/actions.ts`
- Produces:
  - `export type SoundName = 'meow' | 'chirp' | 'purr'`
  - `bindingFor('walk').sound` and `bindingFor('trot').sound` are `null`
  - `bindingFor('jump').sound` and `bindingFor('pounce').sound` are `'chirp'`
  - Clip names stay the same. Still never `Death` or `Jump_Loop`.

Exact bindings after this task:

| action | clip | loop | sound | soundGain |
|---|---|---|---|---|
| idle | Idle | true | null | 1 |
| ignore | Idle | true | null | 1 |
| eat | Idle_Eating | true | purr | 0.6 |
| walk | Walk | true | null | 1 |
| trot | Run | true | null | 1 |
| jump | Jump_Start | false | chirp | 0.7 |
| pounce | Jump_Start | false | chirp | 0.7 |
| stunt | Headbutt | false | chirp | 0.7 |
| meow | Idle | false | meow | 1 |
| chirp | Idle | false | chirp | 1 |
| purr | Idle_Eating | true | purr | 0.6 |

Do not add a new paw sample in this pass. Silent walk is the spec default.

- [ ] **Step 1: Write the failing test**

Replace the jump/pounce example in `src/experiments/cat-world/clipMap.test.ts` and add the walk/trot assertion. Keep the Death/Jump_Loop and meow/ignore tests. Full file:

```ts
import { describe, expect, it } from 'vitest'
import { bindingFor } from './clipMap'
import { ALL_PLAYABLE } from './actions'
import type { LogicalAction } from './actions'

const ALL: LogicalAction[] = ['idle', 'ignore', ...ALL_PLAYABLE]

describe('bindingFor', () => {
  it('never binds Death or Jump_Loop', () => {
    for (const action of ALL) {
      const b = bindingFor(action)
      expect(b.clip).not.toBe('Death')
      expect(String(b.clip)).not.toBe('Jump_Loop')
    }
  })

  it('maps jump and pounce to Jump_Start one-shots with a cat voice, not land', () => {
    expect(bindingFor('jump')).toMatchObject({ clip: 'Jump_Start', loop: false, sound: 'chirp' })
    expect(bindingFor('pounce')).toMatchObject({ clip: 'Jump_Start', loop: false, sound: 'chirp' })
    expect(bindingFor('jump').sound).not.toBe('land')
    expect(bindingFor('pounce').sound).not.toBe('land')
  })

  it('does not play paw on walk or trot', () => {
    expect(bindingFor('walk').sound).not.toBe('paw')
    expect(bindingFor('trot').sound).not.toBe('paw')
    expect(bindingFor('walk').sound).toBeNull()
    expect(bindingFor('trot').sound).toBeNull()
  })

  it('maps meow to Idle plus meow sound', () => {
    expect(bindingFor('meow')).toMatchObject({ clip: 'Idle', sound: 'meow' })
  })

  it('maps ignore to silent Idle', () => {
    expect(bindingFor('ignore')).toMatchObject({ clip: 'Idle', sound: null })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/experiments/cat-world/clipMap.test.ts
```

Expected: FAIL — jump still binds `land`, walk still binds `paw`.

- [ ] **Step 3: Write minimal implementation**

Replace `src/experiments/cat-world/clipMap.ts` with:

```ts
import type { LogicalAction } from './actions'

export type PackClip = 'Idle' | 'Idle_Eating' | 'Walk' | 'Run' | 'Jump_Start' | 'Headbutt'
export type SoundName = 'meow' | 'chirp' | 'purr'

export type ClipBinding = {
  clip: PackClip
  loop: boolean
  sound: SoundName | null
  soundGain: number
}

const BINDINGS: Record<LogicalAction, ClipBinding> = {
  idle: { clip: 'Idle', loop: true, sound: null, soundGain: 1 },
  ignore: { clip: 'Idle', loop: true, sound: null, soundGain: 1 },
  eat: { clip: 'Idle_Eating', loop: true, sound: 'purr', soundGain: 0.6 },
  walk: { clip: 'Walk', loop: true, sound: null, soundGain: 1 },
  trot: { clip: 'Run', loop: true, sound: null, soundGain: 1 },
  jump: { clip: 'Jump_Start', loop: false, sound: 'chirp', soundGain: 0.7 },
  pounce: { clip: 'Jump_Start', loop: false, sound: 'chirp', soundGain: 0.7 },
  stunt: { clip: 'Headbutt', loop: false, sound: 'chirp', soundGain: 0.7 },
  meow: { clip: 'Idle', loop: false, sound: 'meow', soundGain: 1 },
  chirp: { clip: 'Idle', loop: false, sound: 'chirp', soundGain: 1 },
  purr: { clip: 'Idle_Eating', loop: true, sound: 'purr', soundGain: 0.6 },
}

export function bindingFor(action: LogicalAction): ClipBinding {
  return BINDINGS[action]
}
```

In `public/assets/cat-world/ATTRIBUTION.md`, delete the `audio/paw.mp3` and `audio/land.mp3` rows from the BigSoundBank table. Leave meow/chirp/purr.

Then remove the unused files (do not add `._*` files):

```bash
git rm -f public/assets/cat-world/audio/paw.mp3 public/assets/cat-world/audio/land.mp3
rm -f public/assets/cat-world/audio/._paw.mp3 public/assets/cat-world/audio/._land.mp3
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/experiments/cat-world/clipMap.test.ts src/experiments/cat-world/CatActor.test.ts
```

Expected: PASS. `SoundName` no longer includes `'paw' | 'land'`; audio player tests already use `'meow'` / `'chirp'` only.

- [ ] **Step 5: Commit**

```bash
git add src/experiments/cat-world/clipMap.ts src/experiments/cat-world/clipMap.test.ts public/assets/cat-world/ATTRIBUTION.md
git add -u public/assets/cat-world/audio
git commit -m "$(cat <<'EOF'
fix: stop playing human footsteps on cat walk and jump

EOF
)"
```

---

### Task 3: Step and jump motion helpers

**Files:**
- Modify: `src/experiments/cat-world/idleLife.ts`
- Modify: `src/experiments/cat-world/idleLife.test.ts`

**Interfaces:**
- Consumes: existing `clampToYard`, `YARD_HALF`
- Produces:
  - `export type Vec3 = [number, number, number]`
  - `export type MoveMode = 'step' | 'wander'`
  - `export const DEFAULT_FACING: Vec3 = [0, 0, -1]`
  - `export const STEP_DISTANCE = 1.2`
  - `export const STEP_DURATION_S = 0.8`
  - `export const STEP_DURATION_MS = 800`
  - `export const JUMP_DISTANCE = 0.5`
  - `export const JUMP_DURATION_S = 0.5`
  - `export function translateClamped(position: Vec3, dir: Vec3, distance: number): Vec3`
  - `export function destinationFor(action: LogicalAction, moveMode: MoveMode, facing: Vec3, from: Vec3): Vec3`
  - `export function yawFromFacing(facing: Vec3, offset = 0): number` — `Math.atan2(facing[0], facing[2]) + offset`

`destinationFor` rules:
- `'step'` + `'walk'` → `translateClamped(from, facing, STEP_DISTANCE)`
- `'step'` + `'jump'` or `'pounce'` → `translateClamped(from, facing, JUMP_DISTANCE)`
- anything else → `from` (wander/idle/voice do not use this helper to move)

Keep `figureEight` and `clampToYard` unchanged.

- [ ] **Step 1: Write the failing test**

Append to `src/experiments/cat-world/idleLife.test.ts` (keep the existing clamp/figure-eight tests):

```ts
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FACING,
  JUMP_DISTANCE,
  STEP_DISTANCE,
  YARD_HALF,
  clampToYard,
  destinationFor,
  figureEight,
  translateClamped,
  yawFromFacing,
} from './idleLife'

describe('clampToYard', () => {
  it('keeps points inside the yard', () => {
    expect(clampToYard(0, 0)).toEqual([0, 0])
    const [x, z] = clampToYard(40, -40)
    expect(Math.abs(x)).toBeLessThanOrEqual(YARD_HALF)
    expect(Math.abs(z)).toBeLessThanOrEqual(YARD_HALF)
  })
})

describe('figureEight', () => {
  it('stays inside the radius box', () => {
    for (let t = 0; t < 10; t += 0.3) {
      const [x, z] = figureEight(t, 1.8)
      expect(Math.abs(x)).toBeLessThanOrEqual(1.8 + 1e-6)
      expect(Math.abs(z)).toBeLessThanOrEqual(1.8 + 1e-6)
    }
  })
})

describe('translateClamped', () => {
  it('moves 1.2 m along W (negative Z)', () => {
    expect(translateClamped([0, 0, 0], [0, 0, -1], STEP_DISTANCE)).toEqual([0, 0, -1.2])
  })

  it('clamps instead of leaving the yard', () => {
    const next = translateClamped([YARD_HALF, 0, 0], [1, 0, 0], STEP_DISTANCE)
    expect(next[0]).toBe(YARD_HALF)
    expect(next[2]).toBe(0)
  })
})

describe('destinationFor', () => {
  it('steps 1.2 m in facing when moveMode is step', () => {
    expect(destinationFor('walk', 'step', [1, 0, 0], [0, 0, 0])).toEqual([1.2, 0, 0])
  })

  it('hops 0.5 m along stored facing for a step jump', () => {
    expect(destinationFor('jump', 'step', DEFAULT_FACING, [0, 0, 0])).toEqual([
      0,
      0,
      -JUMP_DISTANCE,
    ])
  })

  it('does not translate wander walks', () => {
    expect(destinationFor('walk', 'wander', [1, 0, 0], [0.4, 0, 0.2])).toEqual([0.4, 0, 0.2])
  })
})

describe('yawFromFacing', () => {
  it('faces negative Z at PI (nose away from the camera)', () => {
    expect(yawFromFacing([0, 0, -1])).toBeCloseTo(Math.PI)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/experiments/cat-world/idleLife.test.ts
```

Expected: FAIL — `translateClamped` / `destinationFor` / `yawFromFacing` are not exported.

- [ ] **Step 3: Write minimal implementation**

Replace `src/experiments/cat-world/idleLife.ts` with:

```ts
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

export function clampToYard(x: number, z: number): [number, number] {
  return [
    Math.max(-YARD_HALF, Math.min(YARD_HALF, x)),
    Math.max(-YARD_HALF, Math.min(YARD_HALF, z)),
  ]
}

export function figureEight(tSeconds: number, radius: number): [number, number] {
  return [radius * Math.sin(tSeconds), radius * Math.sin(tSeconds) * Math.cos(tSeconds)]
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

export function yawFromFacing(facing: Vec3, offset = 0): number {
  return Math.atan2(facing[0], facing[2]) + offset
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/experiments/cat-world/idleLife.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/experiments/cat-world/idleLife.ts src/experiments/cat-world/idleLife.test.ts
git commit -m "$(cat <<'EOF'
feat: add clamped step and jump destinations for the cat

EOF
)"
```

---

### Task 4: World reducer — facing, moveMode, reserved interrupt

**Files:**
- Modify: `src/experiments/cat-world/nudgeReduce.ts`
- Modify: `src/experiments/cat-world/nudgeReduce.test.ts`

**Interfaces:**
- Consumes: `commandFromKey` from Task 1; `DEFAULT_FACING`, `MoveMode`, `Vec3` from Task 3; existing `pickReaction` / queue helpers
- Produces: `WorldState` gains:
  - `facing: Vec3` — unit XZ, initial `DEFAULT_FACING` (`[0, 0, -1]`)
  - `moveMode: MoveMode` — initial `'wander'`
- `reduceNudge` now:
  1. `const cmd = commandFromKey(nudge.key)`
  2. Reserved `step`: action `'walk'`, `facing = cmd.dir`, `moveMode = 'step'`, **interrupt even a playing one-shot**, queue `{ current: 'walk', next: null }`, bump `seq`
  3. Reserved `jump`: action `'jump'`, keep `facing`, `moveMode = 'step'`, interrupt one-shot, queue `{ current: 'jump', next: null }`, bump `seq`
  4. `nudge`: existing picker + queue. Looping actions still interrupt immediately. One-shots still finish; the new nudge **replaces `next`**. Starting a nudge `'walk'` / `'trot'` sets `moveMode: 'wander'` and **does not** change `facing`.
- `reduceActionEnd` idle-life walk uses `moveMode: 'wander'` and does not change `facing`. Advancing a queued nudge walk/trot also uses `'wander'`.
- Reserved keys never call `pickReaction`.
- Queue length still never exceeds 1.

Existing Space-as-nudge tests must be updated: Space is reserved. Keep Enter as the one-shot queue case.

- [ ] **Step 1: Write the failing tests**

Replace `src/experiments/cat-world/nudgeReduce.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { initialWorld, reduceActionEnd, reduceNudge } from './nudgeReduce'
import type { Nudge } from './actions'

const n = (key: string): Nudge => ({ key, family: 'wild', at: 0 })

describe('reduceNudge reserved keys', () => {
  it('makes A a left step, never a voice pick', () => {
    const next = reduceNudge(initialWorld(), n('a'), () => 0)
    expect(next.action).toBe('walk')
    expect(next.facing).toEqual([-1, 0, 0])
    expect(next.moveMode).toBe('step')
    expect(next.queue.next).toBeNull()
  })

  it('makes Space a sure jump and keeps default facing', () => {
    const next = reduceNudge(initialWorld(), n(' '), () => 0)
    expect(next.action).toBe('jump')
    expect(next.moveMode).toBe('step')
    expect(next.facing).toEqual([0, 0, -1])
  })

  it('never ignores WASD', () => {
    for (const key of ['w', 'a', 's', 'd']) {
      const next = reduceNudge(initialWorld(), n(key), () => 0)
      expect(next.action).toBe('walk')
      expect(next.moveMode).toBe('step')
    }
  })

  it('interrupts a playing one-shot so a reserved key is reliable', () => {
    const jumping = reduceNudge(initialWorld(), n(' '), () => 0.2)
    expect(jumping.action).toBe('jump')
    const stepped = reduceNudge(jumping, n('d'), () => 0.2)
    expect(stepped.action).toBe('walk')
    expect(stepped.facing).toEqual([1, 0, 0])
    expect(stepped.queue).toEqual({ current: 'walk', next: null })
    expect(stepped.seq).toBeGreaterThan(jumping.seq)
  })

  it('keeps queue length 1; latest reserved next wins by interrupting', () => {
    const first = reduceNudge(initialWorld(), n('w'), () => 0.2)
    const second = reduceNudge(first, n('s'), () => 0.2)
    expect(second.queue.current).toBe('walk')
    expect(second.queue.next).toBeNull()
    expect(second.facing).toEqual([0, 0, 1])
  })
})

describe('reduceNudge unreserved keys', () => {
  it('still ignores on the 15% roll', () => {
    const next = reduceNudge(initialWorld(), n('e'), () => 0)
    expect(next.action).toBe('ignore')
  })

  it('does not steal facing when a nudge walk starts', () => {
    const stepped = reduceNudge(initialWorld(), n('d'), () => 0.2)
    const ended = reduceActionEnd(stepped, () => 0.99)
    const nudged = reduceNudge(ended, n('f'), () => 0.2)
    if (nudged.action === 'walk' || nudged.action === 'trot') {
      expect(nudged.moveMode).toBe('wander')
    }
    expect(nudged.facing).toEqual([1, 0, 0])
  })

  it('queues a second nudge during a one-shot without dropping current', () => {
    const first = reduceNudge(initialWorld(), n('Enter'), () => 0.2)
    expect(first.action).toBe('jump')
    const second = reduceNudge(first, n('Enter'), () => 0.2)
    expect(second.action).toBe('jump')
    expect(second.queue.current).toBe('jump')
    expect(second.queue.next).toBe('jump')
  })

  it('interrupts looping idle immediately', () => {
    const next = reduceNudge(initialWorld(), n('Enter'), () => 0.2)
    expect(next.action).toBe('jump')
    expect(next.queue.next).toBeNull()
  })

  it('sets lastKey and a fact', () => {
    const next = reduceNudge(initialWorld(), n(' '), () => 0)
    expect(next.lastKey).toBe(' ')
    expect(next.fact && next.fact.length > 8).toBe(true)
  })
})

describe('reduceActionEnd', () => {
  it('returns to idle life when the queue is empty', () => {
    const s = reduceActionEnd(initialWorld(), () => 0.99)
    expect(['idle', 'eat', 'walk']).toContain(s.action)
  })

  it('uses wander for idle-life walk and keeps last reserved facing', () => {
    const stepped = reduceNudge(initialWorld(), n('a'), () => 0.2)
    const ended = reduceActionEnd(
      { ...stepped, queue: { current: stepped.action, next: null } },
      () => 0.05,
    )
    expect(ended.action).toBe('walk')
    expect(ended.moveMode).toBe('wander')
    expect(ended.facing).toEqual([-1, 0, 0])
  })

  it('bumps seq when promoting a queued Enter jump', () => {
    const first = reduceNudge(initialWorld(), n('Enter'), () => 0.2)
    const second = reduceNudge(first, n('Enter'), () => 0.2)
    expect(second.queue.next).toBe('jump')
    const ended = reduceActionEnd(second, () => 0.2)
    expect(ended.action).toBe('jump')
    expect(ended.seq).toBeGreaterThan(second.seq)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/experiments/cat-world/nudgeReduce.test.ts
```

Expected: FAIL — `facing` / `moveMode` missing; Space with rng `0` currently returns `'ignore'`.

- [ ] **Step 3: Write minimal implementation**

Replace `src/experiments/cat-world/nudgeReduce.ts` with:

```ts
import { commandFromKey } from '../../shared/input/commandFromKey'
import type { LogicalAction, Nudge, Rng } from './actions'
import { factFor } from './facts'
import { DEFAULT_FACING, type MoveMode, type Vec3 } from './idleLife'
import { advanceQueue, emptyQueue, offerReaction, pickReaction, type ReactionQueue } from './reactionPicker'

export type WorldState = {
  queue: ReactionQueue
  action: LogicalAction
  lastKey: string | null
  fact: string | null
  seq: number
  facing: Vec3
  moveMode: MoveMode
}

export function initialWorld(): WorldState {
  return {
    queue: emptyQueue(),
    action: 'idle',
    lastKey: null,
    fact: null,
    seq: 0,
    facing: DEFAULT_FACING,
    moveMode: 'wander',
  }
}

const INTERRUPTIBLE: ReadonlySet<LogicalAction> = new Set([
  'idle',
  'ignore',
  'eat',
  'walk',
  'trot',
  'purr',
])

function startAction(
  state: WorldState,
  action: LogicalAction,
  nudge: Nudge,
  rng: Rng,
  extra: Pick<WorldState, 'facing' | 'moveMode'>,
): WorldState {
  return {
    queue: { current: action, next: null },
    action,
    lastKey: nudge.key,
    fact: factFor(action, rng),
    seq: state.seq + 1,
    facing: extra.facing,
    moveMode: extra.moveMode,
  }
}

export function reduceNudge(state: WorldState, nudge: Nudge, rng: Rng): WorldState {
  const cmd = commandFromKey(nudge.key)

  if (cmd.type === 'step') {
    return startAction(state, 'walk', nudge, rng, { facing: cmd.dir, moveMode: 'step' })
  }
  if (cmd.type === 'jump') {
    return startAction(state, 'jump', nudge, rng, { facing: state.facing, moveMode: 'step' })
  }

  const picked = pickReaction({ ...nudge, family: cmd.family }, rng)
  const fact = factFor(picked, rng)
  const wanderIfMove: MoveMode =
    picked === 'walk' || picked === 'trot' ? 'wander' : state.moveMode

  if (state.queue.current === null || INTERRUPTIBLE.has(state.action)) {
    return {
      queue: { current: picked, next: null },
      action: picked,
      lastKey: nudge.key,
      fact,
      seq: state.seq + 1,
      facing: state.facing,
      moveMode: wanderIfMove,
    }
  }

  const queue = offerReaction({ current: state.action, next: state.queue.next }, picked)
  return { ...state, queue, lastKey: nudge.key, fact }
}

export function reduceActionEnd(state: WorldState, rng: Rng): WorldState {
  const queue = advanceQueue(state.queue)
  if (queue.current) {
    const moveMode: MoveMode =
      queue.current === 'walk' || queue.current === 'trot' ? 'wander' : state.moveMode
    return { ...state, queue, action: queue.current, moveMode, seq: state.seq + 1 }
  }
  const r = rng()
  const action: LogicalAction = r < 0.1 ? 'walk' : r < 0.3 ? 'eat' : 'idle'
  const moveMode: MoveMode = action === 'walk' ? 'wander' : state.moveMode
  return { ...state, queue: { current: action, next: null }, action, moveMode, seq: state.seq + 1 }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/experiments/cat-world/nudgeReduce.test.ts src/shared/input/commandFromKey.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/experiments/cat-world/nudgeReduce.ts src/experiments/cat-world/nudgeReduce.test.ts
git commit -m "$(cat <<'EOF'
feat: drive reserved WASD and Space through the cat world reducer

EOF
)"
```

---

### Task 5: RiggedCat step motion, yaw, and 0.8s walk timeout

**Files:**
- Modify: `src/experiments/cat-world/CatActor.tsx`
- Modify: `src/experiments/cat-world/CatWorld.tsx`
- Modify: `src/experiments/cat-world/useCatWorld.ts`
- Modify: `src/experiments/cat-world/index.tsx`

**Interfaces:**
- Consumes: `destinationFor`, `yawFromFacing`, `figureEight`, `clampToYard`, `STEP_DURATION_S`, `STEP_DURATION_MS`, `JUMP_DURATION_S`, `MoveMode`, `Vec3`
- Produces:
  - `RiggedCat` props add `facing: Vec3` and `moveMode: MoveMode`
  - Figure-eight runs only when `moveMode === 'wander'` and action is `'walk'` or `'trot'`
  - When `moveMode === 'step'` and action is `'walk'` / `'jump'` / `'pounce'`, lerp `positionRef` from the pose at `seq` change to `destinationFor(...)` over `STEP_DURATION_S` or `JUMP_DURATION_S`
  - Each frame set `group.rotation.y = yawFromFacing(facing)` (default offset `0`). If W walks **toward** the camera in the manual check, set offset to `Math.PI` in a `CAT_YAW_OFFSET` constant — do not guess both ways.
  - `useCatWorld` returns `facing` and `moveMode`. Reserved step walk ends after `STEP_DURATION_MS` (800). Idle-life walk/eat stay at 4000ms.
  - Placeholder cat unchanged (still 800ms timer; no translation required).

- [ ] **Step 1: Write a destination-contract test already covered in Task 3; add an actor-facing export test**

Create `src/experiments/cat-world/CatActor.motion.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { destinationFor, yawFromFacing } from './idleLife'

describe('RiggedCat motion contract', () => {
  it('uses step destinations, not figure-eight, for reserved walks', () => {
    expect(destinationFor('walk', 'step', [0, 0, -1], [0, 0, 0])[2]).toBe(-1.2)
    expect(destinationFor('walk', 'wander', [0, 0, -1], [0, 0, 0])).toEqual([0, 0, 0])
  })

  it('yaws from facing so W is PI', () => {
    expect(yawFromFacing([0, 0, -1])).toBeCloseTo(Math.PI)
  })
})
```

This test should pass immediately because Task 3 already implemented the helpers. That is OK — it locks the actor contract before the TSX change. Then implement the actor.

- [ ] **Step 2: Run the contract test**

```bash
npx vitest run src/experiments/cat-world/CatActor.motion.test.ts
```

Expected: PASS.

- [ ] **Step 3: Wire the actor, canvas, and hook**

Add `CAT_YAW_OFFSET` near the top of `CatActor.tsx`:

```ts
export const CAT_YAW_OFFSET = 0
```

Update `RiggedCat` props and motion. Keep clip playback as it is today (`action` + `seq`, never `Death` / `Jump_Loop`). Replace the `useFrame` block and the function signature. Full `RiggedCat` after the existing clip `useEffect`:

```tsx
export function RiggedCat({
  action,
  seq,
  facing,
  moveMode,
  onActionEnd,
  positionRef,
}: {
  action: LogicalAction
  seq: number
  facing: Vec3
  moveMode: MoveMode
  onActionEnd: () => void
  positionRef: MutableRefObject<[number, number, number]>
}) {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(CAT_URL)
  const { actions, mixer } = useAnimations(animations, group)
  const binding = bindingFor(action)
  const startRef = useRef<Vec3>([0, 0, 0])
  const destRef = useRef<Vec3>([0, 0, 0])
  const elapsedRef = useRef(0)
  const tRef = useRef(0)

  useEffect(() => {
    scene.traverse((o) => {
      o.castShadow = true
    })
  }, [scene])

  useEffect(() => {
    const clipName: string = actions[binding.clip] ? binding.clip : 'Idle'
    if (clipName === 'Death' || clipName === 'Jump_Loop') return
    const next = actions[clipName] ?? actions['Idle']
    if (!next) {
      onActionEnd()
      return
    }
    Object.values(actions).forEach((a) => a?.fadeOut(0.15))
    next.reset()
    next.setLoop(binding.loop ? LoopRepeat : LoopOnce, binding.loop ? Infinity : 1)
    next.clampWhenFinished = !binding.loop
    next.fadeIn(0.15).play()
    if (binding.loop) return
    const done = () => onActionEnd()
    mixer.addEventListener('finished', done)
    return () => mixer.removeEventListener('finished', done)
  }, [action, seq, actions, binding, mixer, onActionEnd])

  useEffect(() => {
    const from = positionRef.current
    startRef.current = from
    destRef.current = destinationFor(action, moveMode, facing, from)
    elapsedRef.current = 0
  }, [action, seq, facing, moveMode, positionRef])

  useFrame((_, dt) => {
    if (!group.current) return
    group.current.rotation.y = yawFromFacing(facing, CAT_YAW_OFFSET)

    if (moveMode === 'wander' && (action === 'walk' || action === 'trot')) {
      tRef.current += dt * (action === 'trot' ? 1.1 : 0.6)
      const [x, z] = figureEight(tRef.current, 1.8)
      const [cx, cz] = clampToYard(x, z)
      positionRef.current = [cx, 0, cz]
      group.current.position.set(cx, 0, cz)
      return
    }

    if (moveMode === 'step' && (action === 'walk' || action === 'jump' || action === 'pounce')) {
      const duration = action === 'walk' ? STEP_DURATION_S : JUMP_DURATION_S
      elapsedRef.current += dt
      const t = Math.min(1, elapsedRef.current / duration)
      const [sx, sy, sz] = startRef.current
      const [dx, dy, dz] = destRef.current
      const x = sx + (dx - sx) * t
      const y = sy + (dy - sy) * t
      const z = sz + (dz - sz) * t
      positionRef.current = [x, y, z]
      group.current.position.set(x, y, z)
      return
    }

    const [px, py, pz] = positionRef.current
    group.current.position.set(px, py, pz)
  })

  return (
    <group ref={group} scale={CAT_SCALE} position={positionRef.current}>
      <primitive object={scene} />
    </group>
  )
}
```

Add the missing imports at the top of `CatActor.tsx`:

```ts
import {
  clampToYard,
  destinationFor,
  figureEight,
  JUMP_DURATION_S,
  STEP_DURATION_S,
  yawFromFacing,
  type MoveMode,
  type Vec3,
} from './idleLife'
```

`CatWorld.tsx` — add `facing` and `moveMode` to props and pass them into `RiggedCat`:

```tsx
import { Suspense } from 'react'
import type { MutableRefObject } from 'react'
import { ExperienceCanvas } from '../../shared/r3f/ExperienceCanvas'
import type { LogicalAction } from './actions'
import { PlaceholderCat, RiggedCat } from './CatActor'
import { CatBoundary } from './CatBoundary'
import { FollowCamera } from './FollowCamera'
import type { MoveMode, Vec3 } from './idleLife'
import { Yard } from './Yard'

export function CatWorld({
  action,
  seq,
  facing,
  moveMode,
  onActionEnd,
  positionRef,
}: {
  action: LogicalAction
  seq: number
  facing: Vec3
  moveMode: MoveMode
  onActionEnd: () => void
  positionRef: MutableRefObject<[number, number, number]>
}) {
  return (
    <ExperienceCanvas>
      <Yard />
      <FollowCamera target={positionRef} />
      <CatBoundary fallback={<PlaceholderCat action={action} onActionEnd={onActionEnd} />}>
        <Suspense fallback={<PlaceholderCat action={action} onActionEnd={onActionEnd} />}>
          <RiggedCat
            action={action}
            seq={seq}
            facing={facing}
            moveMode={moveMode}
            onActionEnd={onActionEnd}
            positionRef={positionRef}
          />
        </Suspense>
      </CatBoundary>
    </ExperienceCanvas>
  )
}
```

In `useCatWorld.ts`:

1. Import `STEP_DURATION_MS` from `./idleLife`.
2. Return `facing: state.facing` and `moveMode: state.moveMode`.
3. Replace the walk/eat timeout effect with:

```ts
useEffect(() => {
  const ms =
    state.action === 'walk' && state.moveMode === 'step'
      ? STEP_DURATION_MS
      : state.action === 'walk' || state.action === 'eat'
        ? 4000
        : null
  if (ms === null) return
  const t = window.setTimeout(() => dispatch({ type: 'end' }), ms)
  return () => window.clearTimeout(t)
}, [state.action, state.moveMode, state.seq])
```

Keep the idle 8000ms timer and the audio / nudge subscriptions as they are.

In `index.tsx`, pass the new fields:

```tsx
<CatWorld
  action={world.action}
  seq={world.seq}
  facing={world.facing}
  moveMode={world.moveMode}
  onActionEnd={world.onActionEnd}
  positionRef={world.positionRef}
/>
```

- [ ] **Step 4: Run tests and typecheck**

```bash
npx vitest run
npx tsc -b --pretty false
```

Expected: all tests PASS. `tsc` exits 0.

Manual check on `npm run dev` `/cat-world` (do this before the look task so motion is judged on the current cat):

1. Tap `W` / `ArrowUp`: cat faces away from camera and walks ~1.2 m, then idles. If it moons the camera, set `CAT_YAW_OFFSET = Math.PI` and re-check.
2. Tap `A` / `ArrowLeft`: walks left on screen. No meow.
3. Tap `D` / `S` / arrows: matching directions.
4. Tap Space: always jumps, hops ~0.5 m along last facing (default away from camera).
5. Tap `E`: still a voice/nudge, not a step.
6. Mash Space then WASD during the jump: WASD cuts in.
7. Walk into the yard edge: stays inside, Walk still plays ~0.8 s.
8. Hold a key: no repeat storm.
9. Walk/trot from idle life still uses the figure-eight and does not rewrite facing (next `D` still goes right).

- [ ] **Step 5: Commit**

```bash
git add src/experiments/cat-world/CatActor.tsx src/experiments/cat-world/CatActor.motion.test.ts src/experiments/cat-world/CatWorld.tsx src/experiments/cat-world/useCatWorld.ts src/experiments/cat-world/index.tsx
git commit -m "$(cat <<'EOF'
feat: walk the cat in the key direction and hop on Space

EOF
)"
```

---

### Task 6: House-cat proportions, README, full verification

**Files:**
- Modify: `src/experiments/cat-world/CatActor.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: current Quaternius `public/assets/cat-world/cat.glb` (nodes include `Head`, `Body`, `Tail`, legs)
- Produces: non-uniform scale toward a house-cat read; slightly smaller head; paws on the grass. No new GLB unless a 15-minute re-search finds a CC0/CC-BY already-rigged house cat with Walk + jump.

Look path (locked unless a qualifying GLB appears):

- Change `CAT_SCALE` from `0.3` to a tuple. Start at `[0.28, 0.26, 0.38]` (longer Z, slightly shorter height).
- After the existing `scene.traverse` shadow pass, if `o.name === 'Head'` (or `/head/i`), `o.scale.setScalar(0.85)`.
- If paws float or sink, change only the uniform-ish X/Y pair until they sit on the grass. Do not add physics.

README Cat World section becomes:

```md
## Cat World

Stylized Quaternius cat in a Polyhaven yard.

- WASD and arrow keys walk a short step that way, then idle.
- Space always jumps.
- Other keys still surprise the cat (weighted nudge). `A` is left, not meow.
- Facts appear after each reaction.

Assets live under `public/assets/cat-world`.

Assets and licenses: `public/assets/cat-world/ATTRIBUTION.md`.
```

- [ ] **Step 1: Apply scale in CatActor**

Replace `export const CAT_SCALE = 0.3` with:

```ts
export const CAT_SCALE: [number, number, number] = [0.28, 0.26, 0.38]
```

In the shadow `useEffect`, also shrink the head:

```ts
useEffect(() => {
  scene.traverse((o) => {
    o.castShadow = true
    if (/head/i.test(o.name)) o.scale.setScalar(0.85)
  })
}, [scene])
```

R3F `scale={CAT_SCALE}` already accepts a tuple.

If the 15-minute search **does** find a qualifying GLB: replace `public/assets/cat-world/cat.glb`, keep `CAT_SCALE` as a uniform number that puts paws on the grass, remap clip names in `clipMap.ts` only, and add a row to `ATTRIBUTION.md`. Do not do both a new GLB and the Head/Z stretch.

- [ ] **Step 2: Update README**

Replace the Cat World section in `README.md` with the text in Interfaces.

- [ ] **Step 3: Run the full suite and build**

```bash
npx vitest run
npm run build
```

Expected: all tests PASS. `tsc -b && vite build` succeeds.

Manual (60 seconds on `/cat-world`):

1. WASD/arrows steer; Space always jumps; `E I O U` still voice.
2. Walk and jump do **not** sound like human grass steps. Jump starts with a short chirp. Meow/purr/chirp still sound like a cat.
3. Silhouette reads closer to a house cat than a toy farm animal; paws on the grass.
4. Cat stays in the yard. Camera follows. Overlay still shows the key and a fact.
5. Other keys still surprise. Tab away stops voice.

- [ ] **Step 4: Commit**

```bash
git add src/experiments/cat-world/CatActor.tsx README.md
git commit -m "$(cat <<'EOF'
feat: stretch the farm cat toward a house-cat silhouette

EOF
)"
```

Do not `git push` unless asked.
