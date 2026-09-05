import { describe, expect, it } from 'vitest'
import { MAX_TRIES, MIN_SEP, POT_SPAN } from './constants'
import { spawnPot } from './spawn'

function seqRng(values: number[]) {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]!
}

describe('spawnPot', () => {
  it('stays inside [-POT_SPAN, POT_SPAN] for X and Z', () => {
    const rng = seqRng([0, 1, 0.25, 0.75])
    const [x, z] = spawnPot([0, 0], rng)
    expect(x).toBeGreaterThanOrEqual(-POT_SPAN)
    expect(x).toBeLessThanOrEqual(POT_SPAN)
    expect(z).toBeGreaterThanOrEqual(-POT_SPAN)
    expect(z).toBeLessThanOrEqual(POT_SPAN)
  })

  it('retries until far enough from avoid', () => {
    const rng = seqRng([0.5, 0.5, 1, 1])
    const [x, z] = spawnPot([0, 0], rng)
    expect(Math.hypot(x, z)).toBeGreaterThanOrEqual(MIN_SEP)
    expect(x).toBeCloseTo(POT_SPAN)
    expect(z).toBeCloseTo(POT_SPAN)
  })

  it('keeps the last sample after MAX_TRIES', () => {
    const rng = seqRng(Array.from({ length: MAX_TRIES * 2 }, () => 0.5))
    const [x, z] = spawnPot([0, 0], rng)
    expect(x).toBeCloseTo(0)
    expect(z).toBeCloseTo(0)
  })
})
