# Experiment roadmap

Learning gym for WebGL / React Three Fiber. One shipped scene so far: **Cat World** (`/cat-world`).

This folder is the queue. Each experiment is a new route. One new primitive per route. Do not grow Cat World into a second skill.

| Status | Experiment | Route | Primitive |
|---|---|---|---|
| Done | Cat World | `/cat-world` | GLB + mixer, keyboard, audio, HDRI |
| Next | Shader pond | `/shader-pond` | GLSL + `shaderMaterial` |
| Queued | Particle cursor field | `/particle-field` | `Points` + GPU attributes |
| Queued | Glass poke | `/glass-poke` | Transmission / refraction |
| Queued | Rapier knock-over | `/knock-over` | Rapier physics |
| Queued | Scroll image tube | `/scroll-tube` | Scroll ↔ WebGL sync |

Full write-up: [2026-09-05-experiment-ladder.md](./2026-09-05-experiment-ladder.md)

Shared process for every new slice: copy `_template`, register in `src/app/experiments.ts` and `src/app/App.tsx`, reuse `ExperienceCanvas`, one learning note, ship Pages.