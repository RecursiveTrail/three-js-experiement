import { describe, expect, it } from 'vitest'
import { destinationFor, yawFromFacing } from './idleLife'

describe('RiggedCat motion contract', () => {
  it('uses step destinations, not figure-eight, for reserved walks', () => {
    expect(destinationFor('walk', 'step', [0, 0, -1], [0, 0, 0])[2]).toBe(-1.2)
    expect(destinationFor('walk', 'wander', [0, 0, -1], [0, 0, 0])).toEqual([0, 0, 0])
  })

  it('yaws from facing so W is PI', () => {
    expect(yawFromFacing([0, 0, -1])).toBeCloseTo(Math.PI)
  })
})
