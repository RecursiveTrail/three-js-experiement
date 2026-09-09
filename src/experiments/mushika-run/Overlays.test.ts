import { describe, expect, it } from 'vitest'
import { toastAfterGates } from './Overlays'

describe('toastAfterGates', () => {
  it('clears toast when no gate is last', () => {
    expect(toastAfterGates(undefined, 'Siddhivinayak unlocked')).toBeNull()
    expect(toastAfterGates(undefined, null)).toBeNull()
  })

  it('names the unlocked gate', () => {
    expect(toastAfterGates('siddhivinayak', null)).toBe('Siddhivinayak unlocked')
  })
})
