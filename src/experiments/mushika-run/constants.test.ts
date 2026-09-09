import { describe, expect, it } from 'vitest'
import {
  DRAIN_PER_SECOND,
  GATES,
  drainPerSecond,
  jumpY,
  lastGateLabel,
  nextGateLine,
  worldZ,
} from './constants'

describe('drainPerSecond', () => {
  it('is 0.10/s with 0 gates', () => {
    expect(drainPerSecond(0)).toBeCloseTo(0.1)
  })

  it('multiplies by 1.15 after 1 gate', () => {
    expect(drainPerSecond(1)).toBeCloseTo(0.1 * 1.15)
  })

  it('caps at the fifth-gate rate', () => {
    expect(drainPerSecond(5)).toBeCloseTo(DRAIN_PER_SECOND * 1.15 ** 5)
    expect(drainPerSecond(6)).toBeCloseTo(drainPerSecond(5))
  })
})

describe('nextGateLine', () => {
  it('shows the first gate with remaining metres', () => {
    expect(nextGateLine(0)).toBe('Siddhivinayak · 80m')
    expect(nextGateLine(79.2)).toBe('Siddhivinayak · 1m')
  })

  it('uses beyond copy after Lalbaugcha Raja', () => {
    expect(nextGateLine(600)).toBe('beyond Lalbaugcha Raja')
    expect(nextGateLine(900)).toBe('beyond Lalbaugcha Raja')
  })
})

describe('lastGateLabel', () => {
  it('is none before any gate', () => {
    expect(lastGateLabel([])).toBe('none')
  })

  it('uses the last reached name', () => {
    expect(lastGateLabel(['siddhivinayak', 'andhericha-raja'])).toBe('Andhericha Raja')
  })
})

describe('jumpY and worldZ', () => {
  it('is 0 on the ground and ~0.7 at apex', () => {
    expect(jumpY(null)).toBe(0)
    expect(jumpY(0)).toBeCloseTo(0)
    expect(jumpY(0.5)).toBeCloseTo(0.7)
    expect(jumpY(1)).toBeCloseTo(0)
  })

  it('places ahead in -Z', () => {
    expect(worldZ(20, 0)).toBeCloseTo(-20)
    expect(worldZ(80, 80)).toBeCloseTo(0)
  })
})

describe('GATES', () => {
  it('has five named thresholds', () => {
    expect(GATES.map((g) => [g.id, g.distance])).toEqual([
      ['siddhivinayak', 80],
      ['andhericha-raja', 180],
      ['dagadusheth', 300],
      ['kasba-ganpati', 440],
      ['lalbaugcha-raja', 600],
    ])
  })
})
