# Dahi Handi — Design Spec

Date: 2026-09-05  
Repo: [RecursiveTrail/three-js-experiement](https://github.com/RecursiveTrail/three-js-experiement)  
Status: approved in conversation  
Off-ladder: festival scene; does not replace shader-pond on the GPU ladder

## Problem

Cat World is a keyboard-nudge pet. The next ask is a kid-facing Janmashtami loop: little Krishna in a room, one hanging dahi handi, tap to jump, smash, next pot appears somewhere else, forever.

## Goals

- New experiment at `/dahi-handi`, listed on `/`. Cat World unchanged.
- Stylized mesh Krishna (blue skin, yellow dhoti, peacock feather). No GLB hunt.
- Indoor room. One hanging clay pot at a time.
- **Space** or **click** always smashes the current pot (no miss).
- On smash: ceramic crack + crowd clap (overlapping one-shots).
- After a smash, the ceiling stays empty for a few seconds; then a new pot appears at a different random spot. Endless.
- Smash count on an HTML overlay.

## Non-goals

- Rapier / colliders / miss timing.
- A Krishna GLB, Mixamo, or photoreal temple.
- Crowd meshes (the clap *is* the crowd).
- Background music loop.
- Reusing Cat World’s nudge families or one-voice `SoundName` player.
- Changing Cat World, shared Canvas defaults (except passing a camera), or the GPU ladder order.

## Locked choices

| Topic | Choice |
|---|---|
| Input | Space or click; always smash |
| Queue | One extra jump while a smash or wait is in flight |
| Krishna | Procedural Three.js meshes |
| World | Indoor room, fixed wide camera |
| Motion | Animation-driven arcs, no physics |
| Audio | `crack.mp3` + `clap.mp3` together on smash |
| Pots | One live handi, or none during the post-smash wait |
| Next pot | **2.0 s** after Krishna lands (`break` 0.6 s + `wait` 2.0 s ≈ 2.6 s from smash) |

## Play loop

Idle: Krishna stands on the floor. One pot hangs from a rope.

Space or click (no key repeat) starts a guaranteed smash:

1. Face the pot, run under it (XZ).
2. Jump on a parabola. Apex reaches the pot.
3. At apex: live pot **unmounts**, shards burst at that XZ (~0.6 s), smash count +1, play crack + clap. Ceiling is empty.
4. Krishna lands at the smash spot and idles.
5. After **2.0 s** of idle wait, a new pot appears at a different ceiling XZ.

If a jump command arrives during run / jump / break / wait, set `queued = true` (single slot; latest wins). Run does **not** start until a live pot exists. When wait ends, spawn the new pot; if queued, clear the flag and run at it, else idle.

Other keys do nothing.

## Scene

**Room** ~8×8 m floor, walls ~3.2 m, plaster, wood beams, two warm hanging lamps. No HDRI required; local lights + modest ambient. **Omit the +Z wall** (open side toward the camera, dollhouse) so the interior is not occluded.

**Camera** fixed: position `(0, 3.8, 8.5)`, fov `40`, look at `(0, 1.1, 0)`. Whole room stays in frame. No orbit, no follow.

**Krishna** ~0.9 m tall, **origin at the feet**. Sphere head, short body, yellow dhoti (cone/lathe), dark hair bun, peacock feather, flute on the back (prop only). Run = bobbing stride. Jump = stretch on the arc. Idle = slight breathe. Cartoon jump: feet leave the floor until the hands reach the pot (origin Y ≈ pot Y − 0.7 at apex).

**Handi** is only the live pot: clay body + neck + rope from a beam (`y ≈ 3.0`) to the pot. Hang height of pot center `y ≈ 2.35`. Render it only when `pot` is set. On smash it **disappears**; a **burst** at the old XZ shows 5–8 shard meshes for `0.6` s, then unmounts. The next hanging pot is **not** on screen during shards or the wait — there is a visible empty-ceiling gap.

**Overlay** (HTML, not in the graph): hint “Space or click — smash the handi” and count “N handis”.

## Motion timings

| Phase | Duration |
|---|---|
| run | distance / 5 m/s, clamped to `[0.25, 0.8]` s |
| jump | `0.55` s; smash at `t = 0.5` (near apex) |
| break | `0.6` s (shards + land; pot already gone) |
| wait | `2.0` s (empty ceiling, Krishna idle on the floor) |

Jump apex is straight up: origin Y = pot Y − 0.7 (hands at the pot). Horizontal jump travel is 0 (already under the pot). Krishna Y is `0` on the floor except during jump/break.

## Spawn

Pot XZ is uniform in `[-2.8, 2.8]²` (inset from the ~±4 m walls). When wait ends, sample until distance to the last smash XZ is `≥ 1.6` m, max 12 tries; if still close, keep the last sample so spawn cannot hang. First pot uses the same min-distance vs Krishna’s start `(0, 0)` so it does not spawn on his head.

## Architecture

```
src/experiments/dahi-handi/
  index.tsx           page, overlays, error boundary
  DahiHandi.tsx       Canvas scene
  Room.tsx            walls, floor, beams, lamps
  Krishna.tsx         mesh child; pose from phase + clock
  Handi.tsx           live rope + pot only
  SmashBurst.tsx      shards at the last smash XZ
  useDahiHandi.ts     window Space / click; reducer; audio
  reduce.ts           pure phase machine
  spawn.ts            next pot XZ
  audio.ts            overlapping one-shots
public/assets/dahi-handi/
  audio/crack.mp3
  audio/clap.mp3
  ATTRIBUTION.md
```

Copy `_template`, add `{ id: 'dahi-handi', title: 'Dahi Handi', path: '/dahi-handi', description }` in `experiments.ts`, `Route` in `App.tsx`. Reuse `ExperienceCanvas` with the camera above.

**State** (reducer):

```
phase: 'idle' | 'run' | 'jump' | 'break' | 'wait'
krishna: [x, y, z]
yaw: number
pot: [x, z] | null        // null from smash until wait ends
potId: number             // bump when a new pot actually appears
lastSmash: [x, z] | null  // burst XZ; null before the first smash
smashCount: number
queued: boolean
seq: number               // bump when a smash starts (audio hook)
```

`useFrame` only interpolates the current phase (run lerp XZ, jump parabola). It does not pick pots or count smashes.

**Audio:** experiment-local player. `play('crack')` and `play('clap')` at smash start, **both allowed at once**. Do not call Cat World’s `createAudioPlayer` (it stops the previous voice and is typed to cat `SoundName`). Missing files skip. Tab hide or leave `/dahi-handi`: `stopAll` + drop listeners.

Sounds are CC0 (same class of source as Cat World, e.g. BigSoundBank). License lines go in `ATTRIBUTION.md` when the files land.

**Input:** `keydown` Space (ignore `repeat`), `pointerdown` on the full-viewport wrapper so the overlay does not eat clicks. Active only while `visibilityState === 'visible'` and path is `/dahi-handi`.

## Error handling

- Missing mp3: skip that shot, still smash visually.
- Spawn retries exhausted: use last sample.
- Unknown key: ignore.
- Tab away: stop listening and stop audio.
- Canvas throw: page error boundary with “The room could not load. Try refresh.”

## Testing

- `experiments` lists Dahi Handi at `/dahi-handi`.
- `spawnPot` stays in `[-2.8, 2.8]²` and, when possible, `≥ 1.6` m from the previous XZ (seeded).
- Idle + jump command → `run`. Jump during `break` or `wait` sets `queued`. Wait end spawns a new pot; if `queued`, then `run` toward it and `queued` false, else `idle`.
- Smash increments `smashCount`, sets `pot` to `null`, does **not** bump `potId`. `potId` increments when wait ends and the next pot appears.
- Space repeat is ignored (listener contract; same idea as Cat World).
- Manual: Space and click smash; shards then a ~2 s empty ceiling; next pot elsewhere; crack+clap; count goes up; Krishna stays in the room; Cat World still works.

## Success

A child opens `/dahi-handi`, taps Space or the screen, and little Krishna endlessly breaks hanging handis in a warm room, with a smash sound, a clap, and a rising count.
