import { describe, expect, it } from 'vitest'
import { ExperienceCanvas } from './ExperienceCanvas'
import { Yard } from '../../experiments/cat-world/Yard'

describe('yard exports', () => {
  it('exposes Canvas wrapper and Yard', () => {
    expect(typeof ExperienceCanvas).toBe('function')
    expect(typeof Yard).toBe('function')
  })
})

describe('ExperienceCanvas', () => {
  it('is a function that accepts an optional dpr tuple', () => {
    expect(ExperienceCanvas.length).toBe(1)
  })
})
