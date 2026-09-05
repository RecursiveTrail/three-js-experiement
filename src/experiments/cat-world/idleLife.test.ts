import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FACING,
  JUMP_DISTANCE,
  STEP_DISTANCE,
  YARD_HALF,
  clampToYard,
  destinationFor,
  figureEight,
  translateClamped,
  yawFromFacing,
} from './idleLife'

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

describe('translateClamped', () => {
  it('moves 1.2 m along W (negative Z)', () => {
    expect(translateClamped([0, 0, 0], [0, 0, -1], STEP_DISTANCE)).toEqual([0, 0, -1.2])
  })

  it('clamps instead of leaving the yard', () => {
    const next = translateClamped([YARD_HALF, 0, 0], [1, 0, 0], STEP_DISTANCE)
    expect(next[0]).toBe(YARD_HALF)
    expect(next[2]).toBe(0)
  })
})

describe('destinationFor', () => {
  it('steps 1.2 m in facing when moveMode is step', () => {
    expect(destinationFor('walk', 'step', [1, 0, 0], [0, 0, 0])).toEqual([1.2, 0, 0])
  })

  it('hops 0.5 m along stored facing for a step jump', () => {
    expect(destinationFor('jump', 'step', DEFAULT_FACING, [0, 0, 0])).toEqual([
      0,
      0,
      -JUMP_DISTANCE,
    ])
  })

  it('does not translate wander walks', () => {
    expect(destinationFor('walk', 'wander', [1, 0, 0], [0.4, 0, 0.2])).toEqual([0.4, 0, 0.2])
  })
})

describe('yawFromFacing', () => {
  it('faces negative Z at PI (nose away from the camera)', () => {
    expect(yawFromFacing([0, 0, -1])).toBeCloseTo(Math.PI)
  })
})
