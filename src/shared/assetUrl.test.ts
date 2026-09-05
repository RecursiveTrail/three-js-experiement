import { describe, expect, it } from 'vitest'
import { assetUrl } from './assetUrl'

describe('assetUrl', () => {
  it('prefixes BASE_URL and strips a leading slash', () => {
    expect(assetUrl('/assets/cat-world/cat.glb')).toBe(`${import.meta.env.BASE_URL}assets/cat-world/cat.glb`)
    expect(assetUrl('assets/cat-world/cat.glb')).toBe(`${import.meta.env.BASE_URL}assets/cat-world/cat.glb`)
  })
})
