import { describe, expect, it } from 'vitest'
import { initialWorld, reduceActionEnd, reduceNudge } from './nudgeReduce'
import type { Nudge } from './actions'

const n = (key: string): Nudge => ({ key, family: 'jump', at: 0 })

describe('reduceNudge', () => {
  it('sets lastKey and a fact', () => {
    const next = reduceNudge(initialWorld(), n(' '), () => 0)
    expect(next.lastKey).toBe(' ')
    expect(next.fact && next.fact.length > 8).toBe(true)
  })

  it('queues a second nudge during a one-shot without dropping current', () => {
    const first = reduceNudge(initialWorld(), n(' '), () => 0.2)
    expect(first.action).toBe('jump')
    const second = reduceNudge(first, n('Enter'), () => 0.2)
    expect(second.action).toBe('jump')
    expect(second.queue.current).toBe('jump')
    expect(second.queue.next).toBe('jump')
  })

  it('interrupts looping idle immediately', () => {
    const next = reduceNudge(initialWorld(), n(' '), () => 0.2)
    expect(next.action).toBe('jump')
    expect(next.queue.next).toBeNull()
  })
})

describe('reduceActionEnd', () => {
  it('returns to idle life when the queue is empty', () => {
    const s = reduceActionEnd(initialWorld(), () => 0.99)
    expect(['idle', 'eat', 'walk']).toContain(s.action)
  })

  it('bumps seq when the same one-shot is re-applied', () => {
    const first = reduceNudge(initialWorld(), n(' '), () => 0.2)
    expect(first.action).toBe('jump')
    const second = reduceNudge(first, n(' '), () => 0.2)
    expect(second.action).toBe('jump')
    expect(second.seq > first.seq || second.queue.next === 'jump').toBe(true)
    const ended = reduceActionEnd(second, () => 0.2)
    expect(ended.action).toBe('jump')
    expect(ended.seq).toBeGreaterThan(second.seq)
  })
})
