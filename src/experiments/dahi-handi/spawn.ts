import { MAX_TRIES, MIN_SEP, POT_SPAN } from './constants'

export type Xz = [number, number]

export function spawnPot(avoid: Xz, rng: () => number): Xz {
  let last: Xz = [0, 0]
  for (let i = 0; i < MAX_TRIES; i++) {
    const x = rng() * POT_SPAN * 2 - POT_SPAN
    const z = rng() * POT_SPAN * 2 - POT_SPAN
    last = [x, z]
    if (Math.hypot(x - avoid[0], z - avoid[1]) >= MIN_SEP) return last
  }
  return last
}
