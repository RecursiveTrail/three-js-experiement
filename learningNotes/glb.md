# What is a GLB?

**GLB is a 3D model file.** It is the binary form of **glTF** (GL Transmission Format), the format Three.js actually loads.

Think of it like this:

| You already know | 3D equivalent |
|---|---|
| `.png` / `.jpg` | a still picture |
| `.mp4` | picture + time (video) |
| `.glb` | mesh + materials + (often) bones + animation clips, in **one** file |

## glTF vs GLB

- **`.gltf`** — JSON text that *points at* other files (`.bin` for geometry, `.jpg` for textures). Our clay pot is this style: `planter_pot_clay_1k.gltf` + `.bin` + `textures/`.
- **`.glb`** — the same data, packed into a single binary blob. Easier to ship and load. Our cat is `public/assets/cat-world/cat.glb`.

Same standard. Different packaging. React Three Fiber’s `<useGLTF />` / Three’s `GLTFLoader` load both.

## What is inside our `cat.glb`

1. **Mesh** — the triangles that make the cat’s shape.
2. **Material / texture** — the painted colors (the atlas image is embedded).
3. **Skin (rig)** — a skeleton. Vertices are weighted to bones so legs can bend.
4. **Animation clips** — named recordings of bone motion over time: `Idle`, `Walk`, `Run`, `Jump_Start`, `Headbutt`, etc.

Without the rig + clips, a pretty cat is a statue. That is why the photoreal stills in `refs/` were not enough, and why we used the Quaternius pack.

## Why this format for the web

glTF/GLB is designed for real-time engines (browsers, games). It uses PBR materials Three.js already understands, so we do not import a `.blend` or `.fbx` at runtime.

## In this project

```ts
// later, in Cat World
useGLTF('/assets/cat-world/cat.glb')
```

That one URL gives us the scene graph *and* `gltf.animations` — the clip list the keyboard nudge will play.