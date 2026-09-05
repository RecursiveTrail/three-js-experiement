import { describe, expect, it } from 'vitest'
import { experiments } from './experiments'

describe('experiments', () => {
  it('lists Cat World at /cat-world', () => {
    expect(experiments.some((e) => e.id === 'cat-world' && e.path === '/cat-world')).toBe(true)
  })

  it('lists Dahi Handi at /dahi-handi', () => {
    expect(experiments.some((e) => e.id === 'dahi-handi' && e.path === '/dahi-handi')).toBe(true)
  })
})
