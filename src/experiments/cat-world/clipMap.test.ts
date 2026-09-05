import { describe, expect, it } from 'vitest'
import { bindingFor } from './clipMap'
import { ALL_PLAYABLE } from './actions'
import type { LogicalAction } from './actions'

const ALL: LogicalAction[] = ['idle', 'ignore', ...ALL_PLAYABLE]

describe('bindingFor', () => {
  it('never binds Death or Jump_Loop', () => {
    for (const action of ALL) {
      const b = bindingFor(action)
      expect(b.clip).not.toBe('Death')
      expect(String(b.clip)).not.toBe('Jump_Loop')
    }
  })

  it('maps jump and pounce to Jump_Start one-shots with a cat voice, not land', () => {
    expect(bindingFor('jump')).toMatchObject({ clip: 'Jump_Start', loop: false, sound: 'chirp' })
    expect(bindingFor('pounce')).toMatchObject({ clip: 'Jump_Start', loop: false, sound: 'chirp' })
    expect(bindingFor('jump').sound).not.toBe('land')
    expect(bindingFor('pounce').sound).not.toBe('land')
  })

  it('does not play paw on walk or trot', () => {
    expect(bindingFor('walk').sound).not.toBe('paw')
    expect(bindingFor('trot').sound).not.toBe('paw')
    expect(bindingFor('walk').sound).toBeNull()
    expect(bindingFor('trot').sound).toBeNull()
  })

  it('maps meow to Idle plus meow sound', () => {
    expect(bindingFor('meow')).toMatchObject({ clip: 'Idle', sound: 'meow' })
  })

  it('maps ignore to silent Idle', () => {
    expect(bindingFor('ignore')).toMatchObject({ clip: 'Idle', sound: null })
  })
})
