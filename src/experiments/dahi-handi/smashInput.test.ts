import { describe, expect, it } from 'vitest'
import { subscribeSmashInput } from './smashInput'

describe('subscribeSmashInput', () => {
  it('fires on Space and pointerdown, ignores repeat and other keys', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const seen: string[] = []
    const stop = subscribeSmashInput(window, root, () => seen.push('j'), () => true)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true }))
    root.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(seen).toEqual(['j', 'j'])
    stop()
    root.remove()
  })

  it('does not fire when inactive or when clicking a link', () => {
    const root = document.createElement('div')
    const link = document.createElement('a')
    link.href = '/'
    root.appendChild(link)
    document.body.appendChild(root)
    const seen: string[] = []
    let active = false
    const stop = subscribeSmashInput(window, root, () => seen.push('j'), () => active)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    active = true
    link.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(seen).toHaveLength(0)
    stop()
    root.remove()
  })
})
