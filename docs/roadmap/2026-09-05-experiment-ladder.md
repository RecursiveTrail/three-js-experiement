# R3F experiment ladder

Date: 2026-09-05  
Repo: [RecursiveTrail/three-js-experiement](https://github.com/RecursiveTrail/three-js-experiement)  
Status: captured from research; not a build spec. Spec each experiment before coding.

## Why this ladder

Cat World already covers the first R3F scene: rigged GLB + animation mixer, keyboard input, one-shot audio, HDRI / environment lighting, follow camera, HTML overlays, GitHub Pages.

What is missing is GPU work (shaders, particles, transmission), then physics (explicitly deferred in Cat World), then scroll-synced WebGL.

The internet in 2026 is full of 3D portfolio cities, Kerr black-hole tracers, and WebGPU TSL compute. Those are month-scale. This gym does **one primitive per route**, ~1–3 days each.

Reddit JSON and X timelines were not reachable when this was written. Synthesis is from:

- Three.js forum showcases (interactive robot portfolio, 3D game-city portfolio, Gargantua Kerr tracer)
- Codrops 2025–2026 (Volatile Nexus glass/caustics, glass xylophone, HAOQI.DESIGN, Reactive Depth image tube, Shader.se WebGPU scroll)
- Three.js Journey curriculum (shaders → particles → GPGPU → R3F physics)
- pmndrs R3F / drei instancing docs
- Maxime Heckel (particles, TSL/WebGPU) and Wawa Sensei (GPGPU particles)

## Rule

Do not clone a 3D portfolio. Do not add shaders + physics + scroll to Cat World. Copy `src/experiments/_template`, register the route, ship, stop.

## Shared scaffold (every experiment)

1. Copy `src/experiments/_template` to `src/experiments/<id>`.
2. Add `{ id, title, path, description }` in `src/app/experiments.ts`. Add the `Route` in `src/app/App.tsx`.
3. Reuse `src/shared/r3f/ExperienceCanvas.tsx`. Fork Canvas defaults only if this experiment needs it.
4. One new library or GPU idea. Not two.
5. Tests only for pure logic (reducers, mappers). Visuals are a browser pass.
6. One file in `learningNotes/`. Merge. Pages deploys from `main`.
7. Stop. The next experiment is a new folder.

---

## 1. Shader pond — next

- **Route:** `/shader-pond`
- **Time:** 1–2 days
- **New primitive:** GLSL + drei `shaderMaterial`
- **Why:** Cat World uses stock materials. Journey, Codrops, and shader threads all treat a custom shader as the leap after a first scene.
- **Skip if:** you already write GLSL comfortably.

### Pipeline

1. Copy `_template` → `src/experiments/shader-pond`. Register route.
2. Subdivided plane + drei `shaderMaterial`. Vertex: sine displacement from `uTime`.
3. Pointer → `uMouse` uniform (first mouse-driven scene; keyboard stays on Cat World).
4. Fragment: color from wave height. No PBR, no GLB.
5. Leva sliders: amplitude, frequency, color. Write `learningNotes/shaders.md`.

---

## 2. Particle cursor field

- **Route:** `/particle-field`
- **Time:** 2–3 days
- **New primitive:** `Points` + BufferGeometry attributes, motion on the GPU
- **Why:** Heckel, Wawa Sensei, and Journey treat particles as the next GPU lesson. High visual return without a portfolio.
- **Skip if:** you already know BufferGeometry attributes and instancing.

### Pipeline

1. Scaffold `/particle-field`. Reuse `ExperienceCanvas`.
2. One `Points` mesh, 8k–20k verts, attributes for position, size, color.
3. Vertex shader: slow noise drift. No per-particle JS in `useFrame`.
4. Pointer attractor uniform: particles peel away from the cursor, then settle.
5. `learningNotes/particles.md`: why `Points` beat a loop of meshes; draw-call count.

Do **not** start with WebGPU / TSL compute. That is a later experiment on top of this one.

---

## 3. Glass poke

- **Route:** `/glass-poke`
- **Time:** 2 days
- **New primitive:** transmission / refraction
- **Why:** August 2026 Codrops and the Three.js forum were dominated by glass (Volatile Nexus, xylophone, liquid-glass UI, diamond shaders). Reuses `garden.hdr`.
- **Skip if:** you already used `MeshTransmissionMaterial` in production.

### Pipeline

1. Scaffold `/glass-poke`. HDRI from `public/assets/cat-world/garden.hdr` (or a copy under `public/assets/glass-poke`).
2. Torus or blob with drei `MeshTransmissionMaterial` — real refraction, not opacity.
3. A few colored meshes behind the glass so refraction is readable.
4. Pointer poke: one ripple uniform that displaces the surface, then decays.
5. `learningNotes/transmission.md`: cost of extra FBO passes; when to fake it.

---

## 4. Rapier knock-over

- **Route:** `/knock-over`
- **Time:** 2–3 days
- **New primitive:** `@react-three/rapier`
- **Why:** Cat World v1 listed Rapier as a non-goal. Journey’s R3F physics lesson and marble/dice toys are the usual next interactive step.
- **Skip if:** you already shipped a Rapier or Cannon scene.

### Pipeline

1. Add `@react-three/rapier`. Physics world + gravity + a static floor collider.
2. Stack of 20–40 boxes (or bowls). Instanced mesh + `InstancedRigidBodies` if it stays cheap.
3. Click or Space applies an impulse. Reset button restores the stack.
4. OrbitControls is fine here (this is not the kid-facing cat).
5. `learningNotes/rapier.md`: animation mixer vs rigid bodies — why Cat World stayed clip-driven.

---

## 5. Scroll image tube

- **Route:** `/scroll-tube`
- **Time:** 2–3 days
- **New primitive:** scroll position read in `useFrame`, not React state
- **Why:** 2026 agency Codrops work (image tube, Shader.se, HAOQI.DESIGN) is almost all scroll-driven R3F. Different input from Cat World’s keyboard.
- **Skip if:** you only care about games, not site-shaped 3D.

### Pipeline

1. Tall DOM page + fixed Canvas. Read scroll in `useFrame`.
2. Cylinder of 8–12 textured planes. Loop with modulo so it never ends.
3. Wheel adds velocity; damp each frame. Hover can slow time.
4. Cheap vertex warp from scroll speed. HTML captions overlay, not 3D text.
5. `learningNotes/scroll-webgl.md`: one frame loop. Do not add Lenis unless you actually need it.

---

## What the internet is shipping vs what to copy

| Trend | Where it shows up | For this gym | Why |
|---|---|---|---|
| Custom GLSL / TSL shaders | Journey, Codrops, X | Do first | Highest skill gap vs Cat World |
| GPU particles / GPGPU | Heckel, Wawa, forum | Do second (WebGL `Points` first) | Skip WebGPU compute until WebGL is solid |
| Glass, caustics, diamonds | Codrops Aug 2026, forum | Do third | Looks current; reuses HDRI |
| Rapier / knock-over / marble | Journey, r/threejs lore | Do fourth | Explicit non-goal of Cat World |
| Scroll + DOM/WebGL | Codrops, agency work | Do fifth | Portfolio-shaped, still a gym slice |
| Interactive 3D portfolio city | Three.js forum 2026 | Skip | Weeks of art direction, little new GPU skill |
| Kerr black hole / WebGPU TSL | Forum, Heckel | Later | Needs a second renderer and compute shaders |

## Do not start yet

- WebGPU + TSL compute particles
- Kerr geodesic / black-hole tracer
- FPS Rapier character controller
- Photoreal fur cat
- Multi-scene agency scroll site

Those sit on top of the five slices above.

## How to use this folder

1. Pick the next **Queued** row (default: shader pond).
2. Write a spec under `docs/superpowers/specs/` before coding.
3. After ship, mark it **Done** in [README.md](./README.md) and add a one-line note here if the actual slice diverged.