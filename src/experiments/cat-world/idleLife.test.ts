import { describe, expect, it } from 'vitest'
import { YARD_HALF, clampToYard, figureEight } from './idleLife'

describe('clampToYard', () => {
  it('keeps points inside the yard', () => {
    expect(clampToYard(0, 0)).toEqual([0, 0])
    const [x, z] = clampToYard(40, -40)
    expect(Math.abs(x)).toBeLessThanOrEqual(YARD_HALF)
    expect(Math.abs(z)).toBeLessThanOrEqual(YARD_HALF)
  })
})

describe('figureEight', () => {
  it('stays inside the radius box', () => {
    for (let t = 0; t < 10; t += 0.3) {
      const [x, z] = figureEight(t, 1.8)
      expect(Math.abs(x)).toBeLessThanOrEqual(1.8 + 1e-6)
      expect(Math.abs(z)).toBeLessThanOrEqual(1.8 + 1e-6)
    }
  })
})
