import { describe, expect, it } from 'vitest'
import { GATES, KING_GAP_M, SPAWN_AHEAD_MAX, SPAWN_AHEAD_MIN } from './constants'
import { overlapsGate, spawnNext } from './spawn'

function seqRng(values: number[]) {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]!
}

function inWindow(at: number, distance: number) {
  const ahead = at - distance
  return ahead >= SPAWN_AHEAD_MIN && ahead <= SPAWN_AHEAD_MAX
}

describe('overlapsGate', () => {
  it('rejects placements within 5 m of a gate', () => {
    expect(overlapsGate(80)).toBe(true)
    expect(overlapsGate(84.9)).toBe(true)
    expect(overlapsGate(75)).toBe(false)
    expect(overlapsGate(85)).toBe(false)
  })
})

describe('spawnNext', () => {
  it('places a single ukadiche in the 20–40 m window', () => {
    const rng = seqRng([0, 0.5, 0])
    const items = spawnNext(0, -KING_GAP_M, rng)
    expect(items).toHaveLength(1)
    expect(items[0]!.kind).toBe('ukadiche')
    expect(items[0]!.high).toBe(false)
    expect(items[0]!.lane).toBe(0)
    expect(inWindow(items[0]!.atDistance, 0)).toBe(true)
    expect(overlapsGate(items[0]!.atDistance)).toBe(false)
  })

  it('staggers three ukadiche across all lanes', () => {
    const rng = seqRng([0.3, 0])
    const items = spawnNext(0, -KING_GAP_M, rng)
    expect(items).toHaveLength(3)
    expect(items.map((m) => m.lane)).toEqual([-1, 0, 1])
    expect(items[1]!.atDistance - items[0]!.atDistance).toBeCloseTo(1.5)
    expect(items[2]!.atDistance - items[1]!.atDistance).toBeCloseTo(1.5)
    for (const m of items) {
      expect(inWindow(m.atDistance, 0)).toBe(true)
      expect(overlapsGate(m.atDistance)).toBe(false)
    }
  })

  it('keeps every placement ≥ 5 m from every gate', () => {
    const rng = seqRng([0, 0, 0.5, 0.25, 0.9, 0.1, 0.4, 0.7, 0.2, 0.8])
    const items = spawnNext(55, -KING_GAP_M, rng)
    for (const m of items) {
      expect(inWindow(m.atDistance, 55)).toBe(true)
      for (const g of GATES) {
        expect(Math.abs(m.atDistance - g.distance)).toBeGreaterThanOrEqual(5)
      }
    }
  })

  it('does not spawn a second king inside 80 m', () => {
    const rng = seqRng([0.9, 0.5, 0, 0])
    const items = spawnNext(0, 10, rng)
    expect(items).toHaveLength(1)
    expect(items[0]!.high).toBe(true)
    expect(items[0]!.kind).toBe('talniche')
  })

  it('places ukadiche then talniche 2 m apart in the same lane', () => {
    const rng = seqRng([0.5, 0.5, 0])
    const items = spawnNext(0, -KING_GAP_M, rng)
    expect(items).toHaveLength(2)
    expect(items[0]!.kind).toBe('ukadiche')
    expect(items[1]!.kind).toBe('talniche')
    expect(items[0]!.lane).toBe(items[1]!.lane)
    expect(items[0]!.high).toBe(false)
    expect(items[1]!.high).toBe(false)
    expect(items[1]!.atDistance - items[0]!.atDistance).toBeCloseTo(2)
    for (const m of items) {
      expect(inWindow(m.atDistance, 0)).toBe(true)
    }
  })

  it('spawns a high king when lastKingAt allows it', () => {
    const rng = seqRng([0.9, 0.5, 0, 0])
    const items = spawnNext(0, -KING_GAP_M, rng)
    expect(items).toHaveLength(1)
    expect(items[0]!.kind).toBe('king')
    expect(items[0]!.high).toBe(true)
    expect(inWindow(items[0]!.atDistance, 0)).toBe(true)
  })
})
