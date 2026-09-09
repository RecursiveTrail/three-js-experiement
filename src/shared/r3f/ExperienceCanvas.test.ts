import { describe, expect, it } from 'vitest'
import { ExperienceCanvas } from './ExperienceCanvas'
import { Yard } from '../../experiments/cat-world/Yard'

describe('yard exports', () => {
  it('exposes Canvas wrapper and Yard', () => {
    expect(typeof ExperienceCanvas).toBe('function')
    expect(typeof Yard).toBe('function')
  })
})

// dpr is optional on ExperienceCanvas; Mushika Run passes [1, 2], other scenes omit it.
