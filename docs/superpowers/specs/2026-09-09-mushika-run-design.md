# Mushika Run — Design Spec

Date: 2026-09-09  
Repo: [RecursiveTrail/three-js-experiement](https://github.com/RecursiveTrail/three-js-experiement)  
Status: approved in conversation  
Off-ladder: festival scene; does not replace shader-pond on the GPU ladder  
Mobile: **this experiment is portrait-first.** Cat World and Dahi Handi stay desktop-leaning.

## Problem

The gym has two scenes: Cat World (keyboard pet) and Dahi Handi (tap-to-smash Janmashtami loop). Both play on a phone, but neither is designed for one: keyboard nudges and a wide dollhouse camera fight thumbs and a tall viewport.

The next festival ask is Ganesh Chaturthi: Mushika (Ganpati’s mouse) as a 3-lane endless runner who eats modaks, passes famous pandal gates, and is hunted by Hunger. It has to be readable and playable in portrait on a phone.

## Goals

- New experiment at `/mushika-run`, listed on `/`. Cat World and Dahi Handi unchanged.
- 3-lane endless runner, auto-forward. Swipe left/right to change lane; swipe up or tap to jump.
- Procedural mesh Mushika (no GLB hunt). Festive night street of recycled tiles.
- Hunger (Bhuk) is the only fail: a draining meter plus a rumbling spirit that closes in. No crash obstacles, no slide.
- Three modak kinds with different points and hunger fills.
- Five named pandal gates as distance checkpoints. Crossing one records it for **this run only**.
- Game over shows score, last gate, and the pilgrimage list. Restart from zero. Nothing in `localStorage`.
- Portrait HUD with safe-area insets. Keyboard is a desktop fallback, not the design target.

## Non-goals

- Rapier / colliders / miss-the-obstacle timing.
- Slide, double-jump, or analog stick overlay.
- A mouse GLB, Mixamo, or photoreal temple interiors.
- Persistent achievements, accounts, or a collection book across reloads.
- Landscape-first layout, virtual on-screen buttons, or changing Cat World / Dahi Handi input.
- Background music loop.
- Replacing shader-pond on the GPU ladder.
- Changing shared Canvas defaults except optional camera + `dpr` passed by this page.

## Locked choices

| Topic | Choice |
|---|---|
| Play model | 3-lane auto-runner (Subway Surfers-shaped), portrait chase cam |
| Fail | Hunger meter hits 0; Bhuk silhouette swallows the mouse |
| Obstacles | None that crash. Lanes exist for modaks. Jump exists for high modaks |
| Mouse | Procedural Three.js meshes |
| World | Mouse near origin; street tiles scroll; 3–4 tile types recycled |
| Physics | Kinematic reduce + lerp; no Rapier |
| Achievements | This-run list only; wipe on hunger-catch and on reload |
| Persistence | None |
| Audio | Experiment-local one-shots: collect, gate bell, catch rumble. No BGM |
| Input | Touch swipe/tap primary; arrows/WASD/Space fallback |

## Play loop

Idle start: Mushika in the center lane, full hunger, street already moving. ~3 s hint on the HUD.

While `phase === 'playing'`:

1. World distance increases at **10 m/s**.
2. Hunger drains every tick. After each gate, drain is multiplied by **1.15**, then **caps at the fifth-gate rate** so the endless stretch after Lalbaug is hard but not instant death.
3. Swipe left/right changes `lane` among `-1 | 0 | 1` (clamped). Gameplay lane is instant; the mesh lerps in ~0.12 s.
4. Swipe up or a tap starts a jump if the mouse is on the ground. No double-jump. Duration **0.45 s**, height **~0.7 m**.
5. A ground modak collects when its lane matches and `|zAhead|` is within **0.7 m**. A high modak also requires the mouse to be in the air near apex (`jumpT ∈ [0.30, 0.70]`, where `jumpT` is 0..1 through the hop).
6. Collect: add points, add hunger (clamped to 1), unmount that modak, play nibble.
7. When `distance` crosses a gate threshold the first time: +100 points, push the gate id onto `gatesReached`, toast the name, play bell.
8. After Lalbaugcha Raja the street keeps going, score still climbs, HUD next-gate line becomes “beyond Lalbaugcha Raja”. No sixth named gate.
9. When `hunger <= 0`: `phase = 'over'`. Bhuk envelops the mouse. Play rumble. Movement stops.

Game over overlay: score, last gate name (or “no gate yet”), pilgrimage list, “tap or Space — run again”. Restart restores the initial snapshot.

Other keys and swipe-down do nothing.

## Hunger and modaks

Full bar with no food lasts **10 s** (`drainPerSecond = 0.10`). Multiplier `1.15 ^ gatesReached.length`, capped at `1.15 ^ 5`.

| Kind | Spawn | Hunger | Points | Height |
|---|---|---|---|---|
| `ukadiche` | common | +0.22 | 10 | ground |
| `talniche` | uncommon | +0.40 | 25 | ground or high |
| `king` (mawa) | rare | +0.70 | 50 | usually high |

Silhouettes must read at phone size: steamed pale on a leaf, fried golden, king white with a sparkle.

## Gates

Automatic when any lane’s distance crosses the threshold. Arch/toran spans all three lanes; the lintel shows the name.

| Order | Id | Name on lintel | Distance |
|---|---|---|---|
| 1 | `siddhivinayak` | Siddhivinayak | 80 m |
| 2 | `andhericha-raja` | Andhericha Raja | 180 m |
| 3 | `dagadusheth` | Dagadusheth Halwai | 300 m |
| 4 | `kasba-ganpati` | Kasba Ganpati | 440 m |
| 5 | `lalbaugcha-raja` | Lalbaugcha Raja | 600 m |

At 10 m/s that is ~8 s / 18 s / 30 s / 44 s / 60 s of a fed run.

## Scene

**Camera.** Portrait chase: behind and slightly above Mushika, looking down the three lanes. No orbit, no follow-through world. Wider vertical FOV on a tall viewport so the HUD does not cover the path. Suggested start: position `(0, 2.4, 6.2)`, fov `50`, look at `(0, 0.6, 0)`. `gl.setPixelRatio` capped at **2** via an optional `dpr` on `ExperienceCanvas` (only this page passes it).

**Street.** Lane centers at x = **-1.3, 0, 1.3**. Festive night: marigold edges, rangoli strips, fairy lights, banana-leaf curbs. Recycle 3–4 tile meshes. No HDRI; 1–2 warm lamps + modest ambient. Blob shadow under the mouse, not full-scene shadows.

**Mushika.** ~0.55 m tall, **origin at the feet**. Sphere head, round ears, small brown body, thin tail. Run = bobbing stride. Jump = stretch on the hop. Origin Y is `0` except during jump.

**Gates.** Toran/arch, saffron and marigold, name on the lintel. Short saffron flash when crossed. Spawn the next arch ahead of the camera; despawn behind.

**Bhuk.** Translucent rumbling haze with a faint mouth, drawn behind the mouse (toward the camera’s near plane). Visual distance tracks `hunger`: `1` ≈ almost off-screen, `0.2` ≈ filling the bottom third of the frame, `0` ≈ swallows the mouse. HUD bar and silhouette always agree.

**Overlay** (HTML, not in the graph): hunger bar, score, next gate, hint, home link, game-over card. `pointer-events: none` except the home link and the game-over restart hit target.

## Spawn

Collectibles live in a window **20–40 m ahead**. Despawn when `zAhead < -4`. Do not place a modak within **5 m** of a gate’s distance (keep the arch readable).

`spawn.ts` picks from a small pattern list, seeded so tests are stable:

- single `ukadiche` in a random lane
- three `ukadiche` across all lanes (staggered in z by 1.5 m)
- two-in-a-row same lane (`ukadiche` then `talniche`)
- high `talniche` or high `king` over the center or a side lane

At most one `king` per 80 m. Enough density that a competent player can stay fed at the base drain; missing two clusters in a row should start to feel scary.

## Input

Active only while `visibilityState === 'visible'` and the path is `/mushika-run`.

**Touch** on the full-viewport wrapper (not on `<a>`):

- Dominant-axis swipe, threshold **30 px**.
- Left → `laneLeft`. Right → `laneRight`. Up → `jump`. Down ignored.
- Tap (movement below threshold, `pointerup` on the same target) → `jump`.
- `preventDefault` on `touchmove` so the page does not scroll.

**Keyboard:** ArrowLeft/KeyA → `laneLeft`; ArrowRight/KeyD → `laneRight`; ArrowUp/KeyW/Space → `jump`. Ignore `repeat`. Space `preventDefault` so the page does not scroll.

## Architecture

```
src/experiments/mushika-run/
  index.tsx           page, overlays, error boundary, input subscribe
  MushikaRun.tsx      Canvas scene (camera, dpr, lights, children)
  Street.tsx          recycled tiles from distance
  Mushika.tsx         mesh; pose from lane lerp + jump clock
  Modak.tsx           one collectible
  Gate.tsx            one toran
  Bhuk.tsx            haze; intensity from hunger
  Overlays.tsx        HUD + game over
  useMushikaRun.ts    listeners, tick(dt) from useFrame, audio
  reduce.ts           pure snapshot machine
  spawn.ts            next collectible pattern
  input.ts            swipe / tap / keyboard → commands
  constants.ts        drain, fills, points, lanes, gate table
public/assets/mushika-run/
  audio/nibble.mp3
  audio/bell.mp3
  audio/rumble.mp3
  ATTRIBUTION.md
```

Copy `_template`, add `{ id: 'mushika-run', title: 'Mushika Run', path: '/mushika-run', description }` in `experiments.ts`, `Route` in `App.tsx`. Reuse `ExperienceCanvas` with the camera above and optional `dpr={[1, 2]}`.

**State** (reducer snapshot):

```
phase: 'playing' | 'over'
lane: -1 | 0 | 1
jumpT: number | null     // null on ground; 0..1 through the hop
hunger: number           // 0..1
score: number
distance: number
gatesReached: GateId[]
modaks: { id, kind, lane, high, atDistance }[]
seq: number              // bump on collect / gate / catch for audio
```

`zAhead = atDistance - distance`. Collect when `|zAhead| ≤ 0.7`.

**One clock.** `MushikaRun` `useFrame` calls `tick(dt)` on the hook, which calls `reduce`. There is no second rAF. `Mushika.tsx` lerps visible x toward `lane * 1.3`; it does not decide collects or gates.

**Audio:** experiment-local player (Dahi Handi pattern: overlapping one-shots allowed; do not use Cat World’s one-voice player). Missing files skip. Tab hide or leave `/mushika-run`: `stopAll` + drop listeners.

Sounds are CC0 (same class of source as the other experiments). License lines go in `ATTRIBUTION.md` when the files land.

## HUD copy

- Hint (first ~3 s): `swipe to change lane · swipe up to jump`
- Score: `{n}`
- Next gate: `{Name} · {remaining}m` or `beyond Lalbaugcha Raja`
- Gate toast (~1.2 s): `{Name} unlocked`
- Game over title: `Bhuk caught you`
- Game over body: `score {n}` / `last gate: {Name | none}` / list of reached names
- Restart: `tap or Space — run again`

Hunger bar is the largest HUD element, top safe-area, not overlapping the three lanes in the lower two-thirds of the canvas.

## Error handling

- Missing mp3: skip that shot, still collect / gate / catch visually.
- Spawn would overlap a gate: skip that candidate and try the next pattern.
- Unknown key / swipe-down: ignore.
- Tab away: stop listening and stop audio; freeze the snapshot (do not drain hunger in the background).
- Canvas throw: page error boundary with “The street could not load. Try refresh.”

## Testing

- `experiments` lists Mushika Run at `/mushika-run`.
- `reduce` tick: distance += 10 * dt; hunger falls; `hunger <= 0` → `over` and further ticks do not move distance.
- Collect: matching lane + `|atDistance - distance| ≤ 0.7` increments score and hunger and removes the modak; wrong lane does not; high modak ignored unless `jumpT ∈ [0.30, 0.70]`.
- Hunger clamp: never above 1.
- Drain multiplier: 0 gates → 0.10/s; after 1 gate → 0.10 * 1.15; after 5 gates equals after 6 (cap).
- Gates: crossing 80 m appends `siddhivinayak` once and adds 100; a later tick at 90 m does not append again.
- Restart: returns to the initial snapshot (full hunger, lane 0, empty gates, score 0).
- `input`: left/right/up swipes past 30 px; down ignored; tap jumps; key repeat ignored; pointer on `<a>` ignored.
- `spawn`: seeded patterns have `atDistance` in `[distance+20, distance+40]` and ≥ 5 m from every gate distance.
- Manual on a phone: portrait, swipe lanes, jump for a high modak, hunger bar and Bhuk agree, first gate toasts Siddhivinayak, starve → game over list, restart, Cat World and Dahi Handi still work.

## Success

A person opens `/mushika-run` on a phone, swipes the mouse between three festive lanes, eats modaks to keep Hunger back, and feels a small blessing each time a named pandal arch goes by — until Bhuk catches them and the run’s pilgrimage is listed on the game-over card.
