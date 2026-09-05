import { describe, expect, it } from 'vitest'
import { commandFromKey } from './commandFromKey'

describe('commandFromKey', () => {
  it('maps A to step left, not voice', () => {
    expect(commandFromKey('a')).toEqual({ type: 'step', dir: [-1, 0, 0] })
    expect(commandFromKey('A')).toEqual({ type: 'step', dir: [-1, 0, 0] })
  })

  it('maps WASD and arrows to matching steps', () => {
    expect(commandFromKey('w')).toEqual({ type: 'step', dir: [0, 0, -1] })
    expect(commandFromKey('W')).toEqual({ type: 'step', dir: [0, 0, -1] })
    expect(commandFromKey('ArrowUp')).toEqual({ type: 'step', dir: [0, 0, -1] })
    expect(commandFromKey('s')).toEqual({ type: 'step', dir: [0, 0, 1] })
    expect(commandFromKey('ArrowDown')).toEqual({ type: 'step', dir: [0, 0, 1] })
    expect(commandFromKey('d')).toEqual({ type: 'step', dir: [1, 0, 0] })
    expect(commandFromKey('ArrowRight')).toEqual({ type: 'step', dir: [1, 0, 0] })
    expect(commandFromKey('ArrowLeft')).toEqual({ type: 'step', dir: [-1, 0, 0] })
  })

  it('maps Space to jump', () => {
    expect(commandFromKey(' ')).toEqual({ type: 'jump' })
  })

  it('maps E to a voice nudge, not a step', () => {
    expect(commandFromKey('e')).toEqual({ type: 'nudge', family: 'voice' })
    expect(commandFromKey('E')).toEqual({ type: 'nudge', family: 'voice' })
  })

  it('leaves Enter on the jump family nudge', () => {
    expect(commandFromKey('Enter')).toEqual({ type: 'nudge', family: 'jump' })
  })

  it('never returns a nudge for reserved keys', () => {
    for (const key of ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']) {
      expect(commandFromKey(key).type).not.toBe('nudge')
    }
  })
})
