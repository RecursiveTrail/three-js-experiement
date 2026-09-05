# three-js-experiement

A Vite + React gym for WebGL / React Three Fiber experiments.

## Run

```bash
npm install
npm run dev
```

- `/` — experiment list
- `/cat-world` — backyard cat. Mash the keyboard.

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
