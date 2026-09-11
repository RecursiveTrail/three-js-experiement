# Mushika Run asset licenses

All bundled third-party files are CC0 (public domain). Attribution is not required; listed here so we remember the source.

## BigSoundBank (CC0)

https://bigsoundbank.com — Joseph Sardin / DavidGreck / Axeline T.

| File | Source | Notes |
|---|---|---|
| `audio/nibble.mp3` | [Mouth Noises #1](https://bigsoundbank.com/mouth-noises-1-s0352.html) (#352) | Short mouth noise, ~5s, DavidGreck |
| `audio/bell.mp3` | [Bell 1 O'clock](https://bigsoundbank.com/bell-1-o-clock-s3446.html) (#3446) | Church bell, ~8s, Joseph Sardin & Axeline T. |
| `audio/rumble.mp3` | [Thunder #1](https://bigsoundbank.com/thunder-s2718.html) (#2718) | Single thunder clap, ~23s, Joseph Sardin |

## Inter (SIL Open Font License 1.1)

https://github.com/rsms/inter — The Inter Project Authors. SIL OFL 1.1.

| File | Source | Notes |
|---|---|---|
| `fonts/inter-latin-400-normal.woff` | [Inter](https://github.com/rsms/inter) via Fontsource latin-400 | Bundled for lintel Text; no runtime CDN |

## Roadside Ganpati stills

User-supplied festival images. Not CC0. Keep them experiment-local.

| File | Source | Notes |
|---|---|---|
| `ganpati/ganpati-1.jpg` … `ganpati-7.jpg` | `src/experiments/mushika-run/assets/sample/` | Portrait stills, resized to ≤1024px for roadside boards |

## Shrine clips (experiment-local, not CC0)

User-supplied. Game plays them muted. Until unique per-pandal clips exist, all five gate ids share the same Lalbaugcha Raja close-up (trimmed + compressed from the 9×16 cinematic). Replace any `{id}.mp4` / `{id}.jpg` in place later — no code change.

| File | Source | Notes |
|---|---|---|
| `shrines/siddhivinayak.mp4` (+ `.jpg`) | stand-in: Lalbaug close-up | replace with Siddhivinayak, Prabhadevi |
| `shrines/andhericha-raja.mp4` (+ `.jpg`) | stand-in: Lalbaug close-up | replace with Andhericha Raja, Versova |
| `shrines/dagadusheth.mp4` (+ `.jpg`) | stand-in: Lalbaug close-up | replace with Dagadusheth Halwai, Pune |
| `shrines/kasba-ganpati.mp4` (+ `.jpg`) | stand-in: Lalbaug close-up | replace with Kasba Ganpati, Pune |
| `shrines/lalbaugcha-raja.mp4` (+ `.jpg`) | user cinematic `output/lalbaugcha-raja-cinematic-9x16.mp4` | 8.5–14.0 s close-up, silent H.264, 1080×1920, ~5.5 s / ~1.9 MB |
