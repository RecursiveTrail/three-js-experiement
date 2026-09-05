import { describe, expect, it } from 'vitest'
import { experiments } from './experiments'

describe('experiments', () => {
  it('lists Cat World at /cat-world', () => {
    expect(experiments.some((e) => e.id === 'cat-world' && e.path === '/cat-world')).toBe(true)
  })
})
