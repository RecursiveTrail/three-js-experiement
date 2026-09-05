import { describe, expect, it } from 'vitest'
import { subscribeNudges } from './nudgeBus'
import type { Nudge } from '../../experiments/cat-world/actions'

function press(target: Window, key: string, repeat = false) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, repeat, bubbles: true }))
}

describe('subscribeNudges', () => {
  it('emits a nudge with the voice family for A', () => {
    const seen: Nudge[] = []
    const stop = subscribeNudges(window, (n) => seen.push(n), () => true)
    press(window, 'A')
    expect(seen[0]?.family).toBe('voice')
    expect(seen[0]?.key).toBe('A')
    stop()
  })

  it('ignores repeat and inactive', () => {
    const seen: Nudge[] = []
    let active = true
    const stop = subscribeNudges(window, (n) => seen.push(n), () => active)
    press(window, 'j', true)
    active = false
    press(window, 'j')
    expect(seen).toHaveLength(0)
    stop()
  })
})
