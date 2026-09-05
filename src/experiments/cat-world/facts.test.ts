import { describe, expect, it } from 'vitest'
import { factFor } from './facts'

describe('factFor', () => {
  it('returns a non-empty kid sentence', () => {
    const fact = factFor('pounce', () => 0)
    expect(fact.length).toBeGreaterThan(8)
    expect(fact.includes('pounc') || fact.toLowerCase().includes('hunt')).toBe(true)
  })

  it('picks different lines when rng changes', () => {
    const a = factFor('meow', () => 0)
    const b = factFor('meow', () => 0.99)
    expect(a).not.toBe(b)
  })
})
