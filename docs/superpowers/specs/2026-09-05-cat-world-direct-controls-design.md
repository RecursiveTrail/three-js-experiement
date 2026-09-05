# Cat World — Direct Controls, Look, and Sound

Date: 2026-09-05  
Repo: [RecursiveTrail/three-js-experiement](https://github.com/RecursiveTrail/three-js-experiement)  
Status: approved in conversation  
Amends: `2026-09-05-cat-world-design.md` (nudge-only keyboard)

## Problem

Kids can mash any key and the cat reacts, which is good. Three things are wrong now:

1. WASD, arrows, and Space are only *hints*. Walking follows a figure-eight, not the key.
2. Walk and jump play human grass footsteps, so the voice does not sound like a cat.
3. The Quaternius farm cat reads as a toy, not a house cat.

## Goals

- Keep “any key still does something” for unreserved keys.
- WASD and arrow keys **always** walk a short burst in that direction, then idle.
- Space **always** jumps, then idle.
- `A` is left, not meow. Meows stay on `E I O U` and other unreserved keys.
- Sounds read as a cat: no human footstep samples on walk or jump.
- Cat silhouette closer to a house cat (new licensed GLB if we find one with Walk + Jump; otherwise proportion tweaks on the current file).

## Non-goals

- Hold-to-steer / analog movement.
- Physics (Rapier).
- Photoreal fur or a generated Meshy/Tripo cat in this pass.
- Changing the yard, camera follow, facts overlay, or Pages deploy.
- Playing `Death` or `Jump_Loop`.

## Locked choices

- Movement feel: **tap to step** (not hold-to-walk).
- `A`: **left only**.
- Implementation approach: reserved-key layer now; time-boxed model swap; proportion tweak if no better GLB.

## Controls

Camera sits at `(cat.x, cat.y + 1.1, cat.z + 4.2)` and looks at the cat. Screen mapping is therefore:

| Key | World step | Screen |
|---|---|---|
| `W` / `ArrowUp` | `(0, 0, -1)` | away from camera |
| `S` / `ArrowDown` | `(0, 0, +1)` | toward camera |
| `A` / `ArrowLeft` | `(-1, 0, 0)` | left |
| `D` / `ArrowRight` | `(+1, 0, 0)` | right |
| `Space` | jump | jump |

`Enter` stays on the old jump *family* (weighted pick). Only Space is a sure jump.

Unreserved keys (including `E I O U`, digits, and the rest) keep the existing 15% ignore / 55% family / 30% other picker.

Reserved keys **never** roll ignore or a random other action.

Auto-repeat is still ignored.

## Step and jump motion

**Step (WASD / arrows)**

- Face yaw so the cat’s nose follows the step vector.
- Play `Walk` for **0.8 s**.
- Translate **1.2 m** along the step vector over that 0.8 s (linear).
- Clamp X/Z with existing `clampToYard` (`YARD_HALF = 3.4`).
- Then idle.

**Jump (Space)**

- Play `Jump_Start` once (never `Jump_Loop`).
- Hop **0.5 m** along the stored facing (default `(0, 0, -1)` before any step).
- Clamp, then idle.

**Queue**

- Same one-slot queue as today.
- A new reserved command or nudge replaces `next`.
- Looping actions (idle, walk, eat, purr, ignore, trot) still interrupt immediately.
- One-shots (jump, stunt, meow, chirp) still finish unless a reserved key comes in — reserved keys **do** interrupt a playing one-shot so Space/WASD feel reliable.

**Idle life**

- Figure-eight wander and random eat only run after a command ends and the queue is empty (existing `reduceActionEnd` idle roll).
- Idle wander must not steal facing from the last reserved step; next WASD tap still uses the key’s vector.

## Look

1. Search for a free, already-rigged house-cat GLB with `Walk` (or equivalent) and a jump clip, license CC0 or CC-BY (attribution in `ATTRIBUTION.md`).
2. If found in that search, replace `public/assets/cat-world/cat.glb` and remap names in `clipMap.ts` only.
3. If not found, keep Quaternius and apply non-uniform scale toward a house-cat read: longer body on Z, slightly smaller head, overall scale so paws sit on the grass (start from current `CAT_SCALE = 0.3` and adjust by eye).

Placeholder capsule cat stays the missing-GLB fallback.

## Sound

| Action | Audio |
|---|---|
| Step / walk / trot | Silent, or a short real cat-paw sample if we add one. **Do not** play `paw.mp3` (human grass steps). |
| Space jump / pounce | Short real meow or chirp at start. **Do not** play `land.mp3`. |
| Meow / chirp / purr | Keep real cat recordings. Replace `meow.mp3` only if the current clip is too long or un-catlike. |
| Stunt | Keep a short chirp. |
| Ignore / idle | Silent |

One voice at a time. Missing files still skip, never crash.

Remove or stop referencing `paw.mp3` and `land.mp3` once unused. Update `ATTRIBUTION.md` for any new files.

## Architecture

```
keydown
  → nudge bus (no repeat)
  → commandFromKey(key)
       reserved → { type: 'step', dir } | { type: 'jump' }
       else     → { type: 'nudge', family }  // existing picker
  → world reducer (queue, action, facing, seq)
  → RiggedCat (clip + yaw + translation)
  → audio from clipMap binding
```

`commandFromKey` is a new pure function next to `familyFromKey`. `A` maps to step left before any vowel/voice rule.

World state gains `facing: [number, number, number]` (unit XZ) and `moveMode: 'step' | 'wander'`. Initial facing is `(0, 0, -1)` (nose away from the camera, same as `W`). Steps set facing from `dir` and `moveMode: 'step'`. Jump uses the stored facing. Idle-life walk uses `moveMode: 'wander'` (figure-eight) and does not change stored facing.

`RiggedCat` translates along `facing` only when `moveMode` is `'step'`. Figure-eight is only for `'wander'`.

`clipMap` is the only table for clip name + sound name + gain.

No new npm packages. No physics.

## Error handling

- Unknown reserved key: cannot happen; mapper is a closed set.
- Step that would leave the yard: clamp; still play Walk for 0.8 s in place if already against the bound.
- Missing jump clip: `Idle` + jump sound (existing fallback).
- Missing audio: skip.
- Tab away from `/cat-world`: stop listening and stop voice (existing).

## Testing

- `commandFromKey('a'|'A')` is step left, not voice.
- `commandFromKey('e')` is nudge/voice family.
- `commandFromKey(' ')` is jump.
- Arrows and WASD always return the matching step; never `ignore`.
- Unreserved keys still go through `pickReaction` (seeded distribution unchanged).
- Two reserved commands: queue length stays 1; latest `next` wins.
- Step updates facing and a clamped position by 1.2 m (or less if clamped).
- `bindingFor('walk').sound` is not `paw`; `bindingFor('jump').sound` is not `land`.
- Manual: WASD/arrows steer, Space always jumps, other keys still surprise, cat stays in yard, voices sound like a cat.

## Success

A child can tap arrows or WASD and the cat walks that way, tap Space and it always jumps, mash other keys and still get surprise reactions, and the voice and silhouette read as a cat.
