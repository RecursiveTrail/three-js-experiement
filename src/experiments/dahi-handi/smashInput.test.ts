import { describe, expect, it } from 'vitest'
import { isSmashKey, shouldSmashFromKey, subscribeSmashInput } from './smashInput'

describe('isSmashKey', () => {
  it('accepts Space, Enter, Select, and TV d-pad center', () => {
    expect(isSmashKey({ key: ' ', code: '', keyCode: 0 } as KeyboardEvent)).toBe(true)
    expect(isSmashKey({ key: 'Enter', code: '', keyCode: 0 } as KeyboardEvent)).toBe(true)
    expect(isSmashKey({ key: 'Select', code: '', keyCode: 0 } as KeyboardEvent)).toBe(true)
    expect(isSmashKey({ key: 'Unidentified', code: '', keyCode: 23 } as KeyboardEvent)).toBe(true)
    expect(isSmashKey({ key: 'w', code: 'KeyW', keyCode: 87 } as KeyboardEvent)).toBe(false)
    expect(isSmashKey({ key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 } as KeyboardEvent)).toBe(false)
  })
})

describe('shouldSmashFromKey', () => {
  it('lets Enter activate a focused link instead of smashing', () => {
    const link = document.createElement('a')
    expect(
      shouldSmashFromKey({ key: 'Enter', code: 'Enter', keyCode: 13, target: link } as unknown as KeyboardEvent),
    ).toBe(false)
    expect(shouldSmashFromKey({ key: ' ', code: 'Space', keyCode: 32, target: link } as unknown as KeyboardEvent)).toBe(
      true,
    )
    expect(
      shouldSmashFromKey({
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        target: document.body,
      } as unknown as KeyboardEvent),
    ).toBe(true)
  })
})

describe('subscribeSmashInput', () => {
  it('fires on Space, Enter, and pointerdown, ignores repeat and other keys', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const seen: string[] = []
    const stop = subscribeSmashInput(window, root, () => seen.push('j'), () => true)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true }))
    root.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(seen).toEqual(['j', 'j', 'j'])
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

  it('does not smash on Enter when the home link is focused', () => {
    const root = document.createElement('div')
    const link = document.createElement('a')
    link.href = '/'
    root.appendChild(link)
    document.body.appendChild(root)
    const seen: string[] = []
    const stop = subscribeSmashInput(window, root, () => seen.push('j'), () => true)
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(seen).toHaveLength(0)
    stop()
    root.remove()
  })
})
