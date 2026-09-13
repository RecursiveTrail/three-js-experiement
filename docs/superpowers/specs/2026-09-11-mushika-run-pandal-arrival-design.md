# Mushika Run — Pandal Arrival Design Spec

Date: 2026-09-11  
Repo: [RecursiveTrail/three-js-experiement](https://github.com/RecursiveTrail/three-js-experiement)  
Status: approved in conversation  
Parent: [2026-09-09-mushika-run-design.md](./2026-09-09-mushika-run-design.md)  
Off-ladder: same festival scene. Does not replace shader-pond on the GPU ladder.  
Mobile: still **portrait-first**.

This spec is the next slice of Mushika Run only: roadside flowers, closed gates that open, and a short pandal arrival beat for the **existing five famous pandals**. Ashtavinayak and Ganesh Lok are later specs.

## Problem

The street’s ganpati photo boards look cheap and make every stretch feel the same. Gates are open torans you ghost through; the “blessing” is a 1.8 s spin-hop on the same road. The run never feels like arriving at a real pandal.

## Goals

- Replace roadside photo boards with **stage-wise procedural flowers**.
- Each of the five gates looks **closed**, opens in front of Mushika, then cuts to a **muted looping pandal video** (still-photo fallback) with the 3D mouse doing **namaste**.
- After ~4 s (or tap/Space skip) she is back on the street **past** that open gate, heading to the next.
- Same five gate ids, names, and distances. Same hunger / modaks / Bhuk / input. Cat World and Dahi Handi unchanged.
- After Lalbaugcha Raja the street is still endless. No sixth named gate.

## Non-goals

- Ashtavinayak temples, Ganesh Lok, or any campaign act after these five pandals.
- Video soundtrack, BGM, YouTube, or remote media URLs.
- 3D photoreal temple interiors, mouse GLB, Mixamo.
- Persistent pilgrimage book / `localStorage`.
- Changing gate names, order, or distances.
- Keeping `celebrateT` / the on-street spin-hop.
- Changing Cat World, Dahi Handi, or the GPU ladder.
- Rapier, crash obstacles, slide, double-jump.

## Locked choices

| Topic | Choice |
|---|---|
| Scope | Flowers + closed/opening gates + arrival for the five existing pandals |
| Shrine media | Local muted looping `<video>`; still jpg if video missing/fails; dark fill if both missing |
| Shrine compositing | HTML media **behind** a transparent canvas; same 3D Mushika, namaste pose |
| Shrine end | Auto after **4 s**; tap or Space skips; opening cannot be skipped |
| Hunger / distance | Frozen for opening **and** shrine |
| Resume | `distance = gate.distance + 2.5` so the open gate is behind her |
| Flowers | Procedural meshes; palette by next-gate stretch |
| Photo boards | Removed (`GanpatiAlongRoad` goes away) |
| Clock | One `useFrame` → `reduce`. No second rAF |
| Persistence | None |

## Play loop

`phase`: `'playing' | 'opening' | 'shrine' | 'over'`.

While `playing`: auto-run, hunger, modaks, swipe/jump — unchanged from the parent spec. Unreached gates render **closed**.

When `distance` first crosses a gate threshold (only the earliest unreached gate if a huge `dt` would skip two):

1. Append that `GateId`, **+100**, `cue: 'bell'`.
2. Set `distance = gate.distance` (doors sit at the mouse’s origin).
3. `phase = 'opening'`, `openingT = 0`.
4. **Opening (0.8 s):** street stays up. Distance, hunger, spawn, collect, and lane/jump are frozen. Jump is ignored (does not skip). Doors swing open ~90° in front of her.
5. When `openingT >= 1`: `phase = 'shrine'`, `shrineT = 0`, `openingT = null`.
6. **Shrine (4 s):** Street, gates, modaks, and Bhuk unmount. HTML muted looping video (or still, or dark) fills the viewport. Canvas clear is transparent. Mushika namastes. Hunger still frozen. HUD shows the pandal name and `tap to continue`.
7. Skip: `jump` (tap or Space) during `shrine` only → resume. Does **not** restart the run.
8. Auto: `shrineT >= 1` → resume.
9. **Resume:** `phase = 'playing'`, `openingT` and `shrineT` null, `distance = gate.distance + 2.5`. Drain uses the new `gatesReached.length`. Doors of reached gates stay open. Next-gate HUD is the following pandal, or `beyond Lalbaugcha Raja` after the fifth.

`over` is unchanged: jump or restart → `initialSnapshot()`. Jump during shrine must not take that path.

Restart from game over still wipes gates, score, and distance. Nothing in `localStorage`.

## Gates (unchanged table)

| Order | Id | Name | Distance | Resume distance |
|---|---|---|---|---|
| 1 | `siddhivinayak` | Siddhivinayak | 80 m | 82.5 m |
| 2 | `andhericha-raja` | Andhericha Raja | 180 m | 182.5 m |
| 3 | `dagadusheth` | Dagadusheth Halwai | 300 m | 302.5 m |
| 4 | `kasba-ganpati` | Kasba Ganpati | 440 m | 442.5 m |
| 5 | `lalbaugcha-raja` | Lalbaugcha Raja | 600 m | 602.5 m |

Gate mesh: named lintel (as today) plus **two closed door leaves** that meet at x = 0 and span all three lanes. Closed = no see-through gap. During opening of **this** gate, each leaf lerps to ±90° with `openingT`. Any reached gate that is not the live opening gate is parked open. Later unreached gates stay closed.

The live pandal is always `gatesReached[gatesReached.length - 1]` during `opening` and `shrine`. No extra id on the snapshot.

## Flowers

`GanpatiAlongRoad` and the roadside `ganpati/*.jpg` **boards** are gone. Curb dressing is procedural flower clumps (spheres / small discs, not photos) at the same side offset as the old boards (~3.2 m), never in the three lanes. Skip clumps within **10 m** of a gate distance so the doors stay readable.

Palette is a function of `distance` (next gate ahead). Mixed clumps inside that palette.

| Distance | Stretch | Dominant | Accents |
|---|---|---|---|
| `[0, 80)` | → Siddhivinayak | marigold `#ffc53d` | saffron `#ff8a1a`, leaf `#5ea04a` |
| `[80, 180)` | → Andhericha Raja | jasmine `#f4f0d8` | cream `#fff4c8`, green `#6b8f4e` |
| `[180, 300)` | → Dagadusheth | hibiscus `#d22b3a` | red `#e85d3a`, gold `#e8a317` |
| `[300, 440)` | → Kasba | lotus `#f2a0b8` | white `#fff8ee` |
| `[440, 600)` | → Lalbaug | deep rose `#b81e48` | marigold `#ffc53d` |
| `>= 600` | beyond Lalbaug | mixed festival | all of the above |

Export `flowerPalette(distance)` from `constants.ts` and unit-test the six buckets. Tiles still recycle; only colors change.

## Shrine scene and HUD

On `shrine`, an HTML layer **behind** the canvas shows, in order:

1. `<video muted loop playsInline autoPlay>` from `public/assets/mushika-run/shrines/{id}.mp4`, `object-fit: cover` (portrait crop), or
2. `<img>` from `public/assets/mushika-run/shrines/{id}.jpg` if the video is missing, errors, or autoplay fails, or
3. a dark `#1a0c10` fill if the jpg is also missing.

Video has **no audio**. The gate bell already played at opening start. No YouTube. No remote URLs. Pause the `<video>` when `visibilityState === 'hidden'` or the path is not `/mushika-run`.

Stills until better photos exist — copy the unused roadside files:

| Gate id | Still |
|---|---|
| `siddhivinayak` | `ganpati/ganpati-1.jpg` → `shrines/siddhivinayak.jpg` |
| `andhericha-raja` | `ganpati/ganpati-2.jpg` → `shrines/andhericha-raja.jpg` |
| `dagadusheth` | `ganpati/ganpati-3.jpg` → `shrines/dagadusheth.jpg` |
| `kasba-ganpati` | `ganpati/ganpati-4.jpg` → `shrines/kasba-ganpati.jpg` |
| `lalbaugcha-raja` | `ganpati/ganpati-5.jpg` → `shrines/lalbaugcha-raja.jpg` |

Mp4s are optional per gate; missing mp4 is the supported path (still). License lines for new shrine files go in `ATTRIBUTION.md`. `ganpati-6.jpg` and `ganpati-7.jpg` are unused after boards come out; do not keep loading them.

**Mushika during shrine:** standing namaste (paws together at the chest), small breathe, no run / hop / spin. Visible X lerps to **0** for the bust shot. Camera `(0, 1.15, 2.6)` looking at `(0, 0.7, 0)`. On resume: chase cam and lane lerp as today.

**HUD copy**

- Opening: hunger bar and score stay. Next-gate line shows only `{Name}` (the gate in front of her).
- Shrine: hunger bar stays (frozen). Centered `{Name}`. Hint `tap to continue`. Home link still works. No `{Name} unlocked` toast — this beat replaces it.
- Playing (after resume): `nextGateLine` as today (`{Name} · {remaining}m` or `beyond Lalbaugcha Raja`).
- Game over: unchanged (`Bhuk caught you`, score, last gate, list, `tap or Space — run again`).

## Video asset guide (for gathering footage)

You need **five short, realistic clips** — one per gate — that feel like Mushika just stepped into that mandap. The game plays them **muted**, **looping**, **full-bleed behind** the 3D mouse (portrait phone, `object-fit: cover`). Mp4s can land one at a time; a missing file uses the jpg still.

### What to capture

The hero is the **murti / decorated sanctum**, not the queue outside and not a walk-through of the whole pandal. A locked-off or very slow shot of the idol in festival light (lamps, marigold, gold) reads as “I arrived.” People in the background are fine if they do not own the frame.

Keep the **idol in the upper-center** of the frame. Mushika namastes in the **lower third**; if Ganpati sits in the bottom half, the mouse will cover his face after the cover-crop.

Prefer **night / aarti / fairy-light** looks. They match the street. Harsh noon documentary and news-camera footage fight the scene.

### What to avoid

- Watermarks, channel logos, subscribe bugs, timestamps, news tickers
- Handheld shake, whip-pans, drone fly-throughs that never settle (they pop on loop)
- Interviews, hosts talking to camera, long approach-from-the-gate walks
- Clips whose only motion is a hard cut every second (loop will flash)
- Depending on soundtrack — we strip/mute audio. Silent or almost-silent files are better (smaller, no copyrighted aarti track bundled by accident)

### Technical

| Spec | Target |
|---|---|
| Files | `public/assets/mushika-run/shrines/{id}.mp4` — exact ids below |
| Codec | H.264 in `.mp4`, `yuv420p` (Safari / iOS). No WebM-only |
| Audio | None, or we ignore it. Export silent if you can |
| Duration | **4–8 seconds**. The beat is 4 s and loops; longer than ~12 s is wasted weight |
| Loop | Last frame should sit next to the first. A gentle hold or tiny sway of lamps loops; a one-way pan does not |
| Orientation | **Portrait 1080×1920** is ideal. Landscape 1920×1080 is OK if the idol stays in the **center third** (we crop the sides on a phone) |
| Size | Aim **≤ 3 MB per file** (cap ~5 MB). This is a phone load in the middle of a run |
| Frame rate | 24 or 30 fps. No 60 fps |
| Color | Rec.709 / typical phone export. No HDR10 (phones will look wrong) |

You do not need to crop to a circle or leave a hole for the mouse. Full-frame video; we overlay Mushika in the canvas.

### One file per gate

| File | Where to look | What should be on screen |
|---|---|---|
| `siddhivinayak.mp4` | Siddhivinayak, Prabhadevi, Mumbai | The black-stone idol under the gold arch, sanctum view |
| `andhericha-raja.mp4` | Andhericha Raja, Versova / Andheri, Mumbai | The large outdoor murti and pandal backdrop |
| `dagadusheth.mp4` | Dagadusheth Halwai, Pune | The iconic Dagadusheth idol (this one is Pune, not Mumbai) |
| `kasba-ganpati.mp4` | Kasba Ganpati, Kasba Peth, Pune | The gram-daivat murti in the temple / decorated inner hall |
| `lalbaugcha-raja.mp4` | Lalbaugcha Raja, Mumbai | The famous navas murti and gold-lit mandap (crowd OK at the edges) |

If you only find a great still for one of them, skip that mp4. The jpg fallback is the designed path, not a failure.

### Rights

Same class as the existing ganpati stills: **you supply footage you can bundle** (your recording, or permission). Not a random YouTube rip. When a file lands, add one line in `public/assets/mushika-run/ATTRIBUTION.md` (who shot it, which year, that it is experiment-local).

### How to drop them in

Put the mp4 next to the jpg, same stem:

```
public/assets/mushika-run/shrines/siddhivinayak.mp4
public/assets/mushika-run/shrines/siddhivinayak.jpg
```

No code change is required per new video if the filename matches the gate id. Refresh `/mushika-run` and reach that gate.

**Stand-in (now):** all five ids currently use the same Lalbaugcha Raja close-up (trimmed 8.5–14.0 s from the 9×16 cinematic, silent, ~1.9 MB). Replace `siddhivinayak` / `andhericha-raja` / `dagadusheth` / `kasba-ganpati` files in place when those clips exist. Keep `lalbaugcha-raja.mp4` as the real Lalbaug shot.

## Architecture

Still `src/experiments/mushika-run/`. One `useFrame` calls `tick(dt)` → `reduce`. Lane lerp and namaste pose are visual; they do not decide gates.

**Snapshot** (replace `celebrateT`):

```
phase: 'playing' | 'opening' | 'shrine' | 'over'
openingT: number | null
shrineT: number | null
lane, jumpT, hunger, score, distance, gatesReached, modaks, seq, cue, …
```

`cue` stays `'nibble' | 'bell' | 'rumble' | null`. Bell on opening start only.

**Tick**

- `playing`: distance += 10 * dt, then collect, then gate detect, then drain, then spawn — same order as today except a new gate sets opening instead of `celebrateT`.
- `opening`: `openingT += dt / 0.8`. No distance, drain, spawn, collect, lane. Ignore `jump`. At 1 → shrine.
- `shrine`: `shrineT += dt / 4`. Same freeze. `jump` → resume. At 1 → resume.
- Resume helper: `phase: 'playing'`, clocks null, `distance = GATES.find(lastId).distance + 2.5`.
- `over`: ignore tick motion; `jump` or `restart` → `initialSnapshot()`.

**Input:** `input.ts` mapping unchanged (tap/Space → `jump`). Reduce interprets `jump` as skip in `shrine`, ignore in `opening`, restart in `over`. Lane swipes during opening/shrine: ignore.

**Files**

- `reduce.ts` / `reduce.test.ts` — phases above; delete celebrate.
- `constants.ts` / `constants.test.ts` — `GATE_OPEN_S = 0.8`, `SHRINE_S = 4`, `PASS_M = 2.5`, `flowerPalette`, shrine `assetUrl`s. Remove `CELEBRATE_S` / `CELEBRATE_HEIGHT` / `celebrateY`.
- `Gate.tsx` — doors; needs `openingT` and whether this id is the live opening gate.
- Replace `GanpatiAlongRoad.tsx` with `FlowersAlongRoad.tsx`; `Street.tsx` mounts flowers instead of photo boards.
- `Mushika.tsx` — namaste when `phase === 'shrine'`; delete celebrate spin.
- `MushikaRun.tsx` — if `shrine`, do not mount Street / gates / modaks / Bhuk; omit opaque `<color>` background; CameraRig uses bust shot.
- `Overlays.tsx` — shrine backdrop (`<video>` / `<img>` / dark fill) plus shrine HUD. Backdrop is a sibling **under** the canvas in `index.tsx` (root already `position: relative`). Overlays owns the `<video>` element and pauses it on `visibilitychange` hidden or when `phase !== 'shrine'`.
- `ExperienceCanvas` — optional `alpha?: boolean`, same pattern as `dpr`. Default unchanged (opaque). Mushika Run **always** passes `alpha: true` so the canvas is not remounted on shrine. Playing/opening/over still set `<color attach="background">`; shrine does not.
- `useMushikaRun.ts` — audio `stopAll` on hide as today. No second media player.

Do not remount `ExperienceCanvas` when entering shrine.

## Error handling

- Missing/failed mp4 → jpg, same 4 s beat.
- Missing jpg too → `#1a0c10`; namaste still runs. Reducer never waits on media.
- Autoplay failure → same as failed video.
- Tab hide / leave `/mushika-run`: pause video, `stopAll` audio, skip `useFrame` ticks (no background drain).
- Unknown key, swipe-down, lane during opening/shrine: ignore.
- Canvas throw: existing boundary copy.

## Testing

- Crossing 80 m: `phase === 'opening'`, `openingT === 0`, `distance === 80`, score +100, `cue === 'bell'`, `gatesReached === ['siddhivinayak']` once.
- During opening: distance and hunger unchanged; `jump` does not change phase; after 0.8 s, `phase === 'shrine'`, `shrineT === 0`.
- During shrine: `jump` or 4 s → `playing`, `distance === 82.5`; hunger unchanged across the whole beat; next drain tick uses `drainPerSecond(1)`.
- Fifth-gate resume: `nextGateLine(602.5) === 'beyond Lalbaugcha Raja'`.
- `over` + `jump` → `initialSnapshot()`; `shrine` + `jump` does not.
- `flowerPalette(0)` marigold stretch; `(81)` jasmine; `(601)` mixed festival.
- Spawn still skips the 5 m gate-clear window; flowers skip the 10 m visual clear.
- Cat World and Dahi Handi still omit `alpha`; their canvas behavior is unchanged.

Manual on a phone: no photo boards; flowers change after a shrine; closed Siddhivinayak opens, video or still + namaste, tap or wait, running again with the open gate behind; starve → game over list; restart.

## Success

A person running `/mushika-run` on a phone sees flowered curbs that change by pilgrimage stretch, not photo frames. A closed named gate opens in front of Mushika, a real pandal fills the screen with her in namaste, then she is on the street again past that gate, hungry, heading for the next.

## Constants (exact)

```
GATE_OPEN_S = 0.8
SHRINE_S = 4
PASS_M = 2.5
SHRINE_CAMERA_POS = [0, 1.15, 2.6]
SHRINE_LOOK_AT = [0, 0.7, 0]
SHRINE_FALLBACK_FILL = '#1a0c10'
```
