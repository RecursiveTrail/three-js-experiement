import { describe, expect, it } from 'vitest'
import { ExperienceCanvas, experienceGl } from './ExperienceCanvas'
import { Yard } from '../../experiments/cat-world/Yard'

describe('yard exports', () => {
  it('exposes Canvas wrapper and Yard', () => {
    expect(typeof ExperienceCanvas).toBe('function')
    expect(typeof Yard).toBe('function')
  })
})

describe('experienceGl', () => {
  it('defaults to an opaque canvas', () => {
    expect(experienceGl()).toEqual({ antialias: true, alpha: false })
    expect(experienceGl(undefined)).toEqual({ antialias: true, alpha: false })
  })

  it('opts into alpha when true', () => {
    expect(experienceGl(true)).toEqual({ antialias: true, alpha: true })
  })
})

// dpr and alpha are optional on ExperienceCanvas; only Mushika Run passes both.
