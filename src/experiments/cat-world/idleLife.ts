export const YARD_HALF = 3.4

export function clampToYard(x: number, z: number): [number, number] {
  return [
    Math.max(-YARD_HALF, Math.min(YARD_HALF, x)),
    Math.max(-YARD_HALF, Math.min(YARD_HALF, z)),
  ]
}

export function figureEight(tSeconds: number, radius: number): [number, number] {
  return [radius * Math.sin(tSeconds), radius * Math.sin(tSeconds) * Math.cos(tSeconds)]
}
