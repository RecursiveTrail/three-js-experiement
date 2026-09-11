import { describe, expect, it } from 'vitest'
import { shrineKind } from './Overlays'

describe('shrineKind', () => {
  it('prefers video, then still, then fill', () => {
    expect(shrineKind(false, false)).toBe('video')
    expect(shrineKind(true, false)).toBe('still')
    expect(shrineKind(true, true)).toBe('fill')
    expect(shrineKind(false, true)).toBe('video')
  })
})
