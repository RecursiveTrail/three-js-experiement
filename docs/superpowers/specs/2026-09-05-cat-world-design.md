# Cat World — Design Spec

Date: 2026-09-05  
Repo: [RecursiveTrail/three-js-experiement](https://github.com/RecursiveTrail/three-js-experiement) (`git@github.com:RecursiveTrail/three-js-experiement.git`)  
Status: approved in conversation; v1 cat is a stylized CC0 pack

## Problem

This repo is a learning gym for a frontend engineer practicing the high-performance visual path (WebGL / 3D / spatial). The first experiment is a kid-facing 3D cat: a stylized rigged pack-cat in a photoreal backyard, reacts when a child mashes the keyboard, and teaches a little about real cat behavior.

AI already writes ordinary React/DOM UI. This project is about the parts it still struggles with: animation blending, camera, lighting, GPU assets, and input that must look like an animal rather than a menu.

## Goals

- One Vite + React + TypeScript app that will host many 3D/Canvas experiments.
- First experiment: **Cat World** at `/cat-world`.
- Stylized Quaternius farm cat (low-poly, already rigged and animated). Photoreal tabby is a later drop-in if a better `cat.glb` arrives.
- Keyboard is a **nudge**, not a remote: kids type anything; the cat often does something related, sometimes something else, sometimes ignores them.
- After a reaction, show one short kid-readable fact.
- World stays photoreal: HDRI sun, contact shadows, animation-driven motion (no physics in v1). The mismatch (toon cat, real yard) is acceptable for v1.

## Non-goals (v1)

- Next.js / SSR.
- Rapier / physics cat (later experiment).
- Orbit-drag camera (kids will throw the view).
- Multiplayer, accounts, or a store.
- Shipping a photoreal fur cat in v1.

## Tech stack

- React 19, Vite, TypeScript
- `three`, `@react-three/fiber`, `@react-three/drei`
- HTML overlays for key hint + fact (not in the WebGL graph)
- Web Audio / simple buffer playback for one-shots (no extra audio framework required)
- Remote: `git@github.com:RecursiveTrail/three-js-experiement.git`

## Architecture

```
src/
  app/                      # shell, experiment list at /
  experiments/
    cat-world/              # this scene
    _template/              # copy for the next experiment
  shared/
    r3f/                    # canvas defaults, lights, camera helpers
    input/                  # keyboard nudge bus
    audio/                  # one-shot / loop players
public/assets/cat-world/    # GLB / HDRI / wav / refs
```

`/` lists experiments. `/cat-world` is a full-viewport Canvas. Keyboard capture is active only while that route is focused.

### Units

**Keyboard nudge bus** (`shared/input`)  
Listens to `keydown`. Ignores auto-repeat. Emits `{ key, family, at }`. Does not pick animations.

**Reaction picker** (`experiments/cat-world`)  
On each nudge, rolls:

- 55% action from that key’s family
- 30% any other cat action
- 15% ignore (stay on `Idle`, no voice)

If a clip is playing, the pick replaces a single-slot “next” queue. No pile-up.

**Cat actor**  
Loads `public/assets/cat-world/cat.glb`. Plays pack clip names via Three’s animation mixer, through the mapping table below. Missing clips fall back to `Idle` + the matching sound. Between nudges: idle life (`Idle` / `Idle_Eating` / short `Walk` on a figure-eight). Walk stays inside an ~8×8 m yard. Jump travel is clamped so the camera never loses the cat. Never play `Death`.

**World**  
Grass plane with `leafy_grass` maps, `garden.hdr` environment + sun, clay pot, painted bench (scale props). No generated backyard mesh.

**Overlays**  
- “You pressed **F**”
- One fact line, e.g. “Cats pounce to practice hunting.”

## Keyboard families

| Keys | Family | Logical actions |
|---|---|---|
| vowels `A E I O U` | voice | meow, chirp, purr (mostly `Idle` + audio; `Idle_Eating` for purr) |
| home row `A S D F G H J K L` | move | walk, trot, idle-eat |
| `Space` `Enter` | jump | jump, pounce |
| numbers `0–9` | stunt | headbutt, leap |
| everything else | wild | full random |

`A` sits in both vowel and home-row; treat it as **voice** (first matching row in the table above).

Optional later: `C` swaps to a tighter “cat TV” close-up. Not v1.

## Scene

- Sunlit backyard, grass ~8×8 m, slight height noise.
- Camera: low (kid-kneeling), slight telephoto, lerp-follow, no orbit.
- Audio: one voice at a time. Ignore can be silent or a tiny rustle.
- Facts are a small map: action → 2–3 one-liners, picked at random.

## Animation clips

v1 file: `public/assets/cat-world/cat.glb` (Quaternius farm cat, already on disk).

Clips in the file: `Idle`, `Idle_Eating`, `Walk`, `Run`, `Jump_Start`, `Jump_Loop`, `Headbutt`, `Death`.

Logical action → clip + sound:

| Logical action | Clip | Loop? | Sound |
|---|---|---|---|
| idle | `Idle` | yes | none |
| ignore | `Idle` | yes | none |
| eat / stretch-ish | `Idle_Eating` | yes | `purr.mp3` |
| walk | `Walk` | yes | `paw.mp3` (quiet) |
| trot | `Run` | yes | `paw.mp3` |
| jump | `Jump_Start` then blend to `Idle` | no | `land.mp3` on recover |
| pounce / leap | `Jump_Start` | no | `land.mp3` |
| stunt | `Headbutt` | no | `chirp.mp3` |
| meow | `Idle` | — | `meow.mp3` |
| chirp | `Idle` | — | `chirp.mp3` |
| purr | `Idle_Eating` | yes | `purr.mp3` |

Do not play `Death`. Do not use `Jump_Loop` in v1 (it would float). A later photoreal `cat.glb` can replace this file if clip names are remapped in one table.

## Assets on disk today

Fetched or generated 2026-09-05. Licenses in `public/assets/cat-world/ATTRIBUTION.md`.

```
public/assets/cat-world/
  cat.glb                                 # Quaternius stylized cat + clips
  yard/garden.hdr                         # Polyhaven Garden Nook 2K
  yard/pot/planter_pot_clay_1k.gltf       # photoreal clay pot
  yard/bench/painted_wooden_bench_1k.gltf # scale prop (no CC0 fence)
  yard/grass/leafy_grass_{diff,nor_gl,arm}_1k.jpg
  audio/{meow,chirp,purr,paw,land}.mp3    # real recordings, BigSoundBank
  refs/cat-bind-pose-front.png            # optional later photoreal upgrade
  refs/cat-bind-pose-side.png
```

### Later upgrade (optional)

`refs/*.png` stay in the repo if we want a photoreal Meshy/Tripo cat later. Swap the file, keep the logical-action table.

## Error handling

- Missing `cat.glb`: render a simple placeholder cat (three capsules) and still run nudge + audio + facts.
- Missing clip name: play `Idle` and the action’s sound if any.
- Missing audio file: skip playback, do not crash.
- Key held down: ignore `repeat` events.
- Tab away from `/cat-world`: stop listening; fade voice.

## Testing

- Unit: family-from-key, weighted picker distribution (seeded), queue length never exceeds 1.
- Manual: mash random keys for 60s; cat never leaves the yard; camera stays readable; facts change; no overlapping meows.

## Success

A child can sit at the keyboard, type nonsense, and watch a lively stylized cat in a sunny yard — and occasionally learn why it just pounced.
