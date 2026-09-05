import { describe, expect, it } from 'vitest'
import { familyFromKey } from './families'

describe('familyFromKey', () => {
  it('treats A as voice, not move', () => {
    expect(familyFromKey('a')).toBe('voice')
    expect(familyFromKey('A')).toBe('voice')
  })

  it('maps vowels to voice', () => {
    for (const k of ['e', 'i', 'o', 'u']) expect(familyFromKey(k)).toBe('voice')
  })

  it('maps remaining home-row letters to move', () => {
    for (const k of ['s', 'd', 'f', 'g', 'h', 'j', 'k', 'l']) {
      expect(familyFromKey(k)).toBe('move')
    }
  })

  it('maps Space and Enter to jump', () => {
    expect(familyFromKey(' ')).toBe('jump')
    expect(familyFromKey('Enter')).toBe('jump')
  })

  it('maps digits to stunt', () => {
    for (const k of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      expect(familyFromKey(k)).toBe('stunt')
    }
  })

  it('maps everything else to wild', () => {
    expect(familyFromKey('z')).toBe('wild')
    expect(familyFromKey('Shift')).toBe('wild')
  })
})
