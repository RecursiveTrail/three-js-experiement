import { describe, expect, it } from 'vitest'
import { commandFromKey, commandFromSwipe, subscribeMushikaInput } from './input'

describe('commandFromSwipe', () => {
  it('uses the dominant axis past 30 px', () => {
    expect(commandFromSwipe(-40, 10)).toBe('laneLeft')
    expect(commandFromSwipe(40, -10)).toBe('laneRight')
    expect(commandFromSwipe(10, -40)).toBe('jump')
    expect(commandFromSwipe(10, 40)).toBeNull()
    expect(commandFromSwipe(20, 20)).toBeNull()
  })
})

describe('commandFromKey', () => {
  it('maps arrows/WASD/Space and ignores other keys and repeat', () => {
    expect(commandFromKey({ code: 'ArrowLeft', repeat: false } as KeyboardEvent)).toBe('laneLeft')
    expect(commandFromKey({ code: 'KeyA', repeat: false } as KeyboardEvent)).toBe('laneLeft')
    expect(commandFromKey({ code: 'ArrowRight', repeat: false } as KeyboardEvent)).toBe('laneRight')
    expect(commandFromKey({ code: 'KeyD', repeat: false } as KeyboardEvent)).toBe('laneRight')
    expect(commandFromKey({ code: 'ArrowUp', repeat: false } as KeyboardEvent)).toBe('jump')
    expect(commandFromKey({ code: 'KeyW', repeat: false } as KeyboardEvent)).toBe('jump')
    expect(commandFromKey({ code: 'Space', repeat: false } as KeyboardEvent)).toBe('jump')
    expect(commandFromKey({ code: 'ArrowDown', repeat: false } as KeyboardEvent)).toBeNull()
    expect(commandFromKey({ code: 'Space', repeat: true } as KeyboardEvent)).toBeNull()
    expect(commandFromKey({ code: 'KeyS', repeat: false } as KeyboardEvent)).toBeNull()
  })
})

function pointerEvent(type: string, init: PointerEventInit & { pointerId: number }) {
  const event = new PointerEvent(type, { bubbles: true, ...init })
  Object.defineProperty(event, 'pointerId', { configurable: true, value: init.pointerId })
  return event
}

describe('subscribeMushikaInput', () => {
  it('fires swipe, tap jump, ignores down-swipe, link pointer, and inactive', () => {
    const root = document.createElement('div')
    const link = document.createElement('a')
    link.href = '/'
    root.appendChild(link)
    document.body.appendChild(root)
    const seen: string[] = []
    let active = true
    const stop = subscribeMushikaInput(window, root, (c) => seen.push(c), () => active)

    root.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true }))
    root.dispatchEvent(new PointerEvent('pointerup', { clientX: 60, clientY: 105, bubbles: true }))
    root.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true }))
    root.dispatchEvent(new PointerEvent('pointerup', { clientX: 104, clientY: 102, bubbles: true }))
    root.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true }))
    root.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 150, bubbles: true }))
    link.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 10, bubbles: true }))
    link.dispatchEvent(new PointerEvent('pointerup', { clientX: 10, clientY: 10, bubbles: true }))

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft', bubbles: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft', repeat: true, bubbles: true }))

    const share = document.createElement('button')
    share.setAttribute('data-skip-input', '')
    root.appendChild(share)
    share.dispatchEvent(new PointerEvent('pointerdown', { clientX: 8, clientY: 8, bubbles: true }))
    share.dispatchEvent(new PointerEvent('pointerup', { clientX: 8, clientY: 8, bubbles: true }))

    active = false
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))

    expect(seen).toEqual(['laneLeft', 'jump', 'laneLeft'])
    stop()
    root.remove()
  })

  it('ignores pointerup from a different pointer id', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const seen: string[] = []
    const stop = subscribeMushikaInput(window, root, (c) => seen.push(c), () => true)

    root.dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1 }))
    root.dispatchEvent(pointerEvent('pointerup', { clientX: 40, clientY: 100, pointerId: 2 }))
    expect(seen).toEqual([])
    root.dispatchEvent(pointerEvent('pointerup', { clientX: 40, clientY: 100, pointerId: 1 }))
    expect(seen).toEqual(['laneLeft'])
    stop()
    root.remove()
  })
})
