# three-js-experiement

A Vite + React gym for WebGL / React Three Fiber experiments.

## Run

```bash
npm install
npm run dev
```

- `/` — experiment list
- `/cat-world` — backyard cat. Mash the keyboard.
- `/dahi-handi` — little Krishna smashes hanging dahi handis.

```bash
npm test
```

Live site: https://recursivetrail.com/three-js-experiement/

Pushes to `main` build and deploy via `.github/workflows/deploy-pages.yml`. Local `npm run dev` still uses `/`.

## Cat World

Stylized Quaternius cat in a Polyhaven yard.

- WASD and arrow keys walk a short step that way, then idle.
- Space always jumps.
- Other keys still surprise the cat (weighted nudge). `A` is left, not meow.
- Facts appear after each reaction.

Assets live under `public/assets/cat-world`.

Assets and licenses: `public/assets/cat-world/ATTRIBUTION.md`.

## Dahi Handi

Stylized mesh Krishna in a dollhouse room.

- Space or click: run under the pot, jump, always smash.
- Crack + clap on smash, then ~2 s of empty ceiling, then a new pot elsewhere.
- Count stays on screen.

Assets: `public/assets/dahi-handi`. Licenses: `public/assets/dahi-handi/ATTRIBUTION.md`.

## Roadmap

Next experiments (shader pond → particles → glass → Rapier → scroll): [docs/roadmap](docs/roadmap/README.md).
