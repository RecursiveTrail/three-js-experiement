import { describe, expect, it } from 'vitest'
import { initialWorld, reduceActionEnd, reduceNudge } from './nudgeReduce'
import type { Nudge } from './actions'

const n = (key: string): Nudge => ({ key, family: 'wild', at: 0 })

describe('reduceNudge reserved keys', () => {
  it('makes A a left step, never a voice pick', () => {
    const next = reduceNudge(initialWorld(), n('a'), () => 0)
    expect(next.action).toBe('walk')
    expect(next.facing).toEqual([-1, 0, 0])
    expect(next.moveMode).toBe('step')
    expect(next.queue.next).toBeNull()
  })

  it('makes Space a sure jump and keeps default facing', () => {
    const next = reduceNudge(initialWorld(), n(' '), () => 0)
    expect(next.action).toBe('jump')
    expect(next.moveMode).toBe('step')
    expect(next.facing).toEqual([0, 0, -1])
  })

  it('never ignores WASD', () => {
    for (const key of ['w', 'a', 's', 'd']) {
      const next = reduceNudge(initialWorld(), n(key), () => 0)
      expect(next.action).toBe('walk')
      expect(next.moveMode).toBe('step')
    }
  })

  it('interrupts a playing one-shot so a reserved key is reliable', () => {
    const jumping = reduceNudge(initialWorld(), n(' '), () => 0.2)
    expect(jumping.action).toBe('jump')
    const stepped = reduceNudge(jumping, n('d'), () => 0.2)
    expect(stepped.action).toBe('walk')
    expect(stepped.facing).toEqual([1, 0, 0])
    expect(stepped.queue).toEqual({ current: 'walk', next: null })
    expect(stepped.seq).toBeGreaterThan(jumping.seq)
  })

  it('keeps queue length 1; latest reserved next wins by interrupting', () => {
    const first = reduceNudge(initialWorld(), n('w'), () => 0.2)
    const second = reduceNudge(first, n('s'), () => 0.2)
    expect(second.queue.current).toBe('walk')
    expect(second.queue.next).toBeNull()
    expect(second.facing).toEqual([0, 0, 1])
  })
})

describe('reduceNudge unreserved keys', () => {
  it('still ignores on the 15% roll', () => {
    const next = reduceNudge(initialWorld(), n('e'), () => 0)
    expect(next.action).toBe('ignore')
  })

  it('does not steal facing when a nudge walk starts', () => {
    const stepped = reduceNudge(initialWorld(), n('d'), () => 0.2)
    const ended = reduceActionEnd(stepped, () => 0.99)
    const nudged = reduceNudge(ended, n('f'), () => 0.2)
    if (nudged.action === 'walk' || nudged.action === 'trot') {
      expect(nudged.moveMode).toBe('wander')
    }
    expect(nudged.facing).toEqual([1, 0, 0])
  })

  it('queues a second nudge during a one-shot without dropping current', () => {
    const first = reduceNudge(initialWorld(), n('Enter'), () => 0.2)
    expect(first.action).toBe('jump')
    const second = reduceNudge(first, n('Enter'), () => 0.2)
    expect(second.action).toBe('jump')
    expect(second.queue.current).toBe('jump')
    expect(second.queue.next).toBe('jump')
  })

  it('interrupts looping idle immediately', () => {
    const next = reduceNudge(initialWorld(), n('Enter'), () => 0.2)
    expect(next.action).toBe('jump')
    expect(next.queue.next).toBeNull()
  })

  it('starts an Enter nudge in wander mode after a reserved step', () => {
    const stepped = reduceNudge(initialWorld(), n('a'), () => 0.2)
    const jumped = reduceNudge(stepped, n('Enter'), () => 0.2)
    expect(jumped.action).toBe('jump')
    expect(jumped.moveMode).toBe('wander')
  })

  it('sets lastKey and a fact', () => {
    const next = reduceNudge(initialWorld(), n(' '), () => 0)
    expect(next.lastKey).toBe(' ')
    expect(next.fact && next.fact.length > 8).toBe(true)
  })
})

describe('reduceActionEnd', () => {
  it('returns to idle life when the queue is empty', () => {
    const s = reduceActionEnd(initialWorld(), () => 0.99)
    expect(['idle', 'eat', 'walk']).toContain(s.action)
  })

  it('uses wander for idle-life walk and keeps last reserved facing', () => {
    const stepped = reduceNudge(initialWorld(), n('a'), () => 0.2)
    const ended = reduceActionEnd(
      { ...stepped, queue: { current: stepped.action, next: null } },
      () => 0.05,
    )
    expect(ended.action).toBe('walk')
    expect(ended.moveMode).toBe('wander')
    expect(ended.facing).toEqual([-1, 0, 0])
  })

  it('clears step mode when idle life returns to idle', () => {
    const stepped = reduceNudge(initialWorld(), n('a'), () => 0.2)
    const ended = reduceActionEnd(stepped, () => 0.99)
    expect(ended.action).toBe('idle')
    expect(ended.moveMode).toBe('wander')
  })

  it('bumps seq when promoting a queued Enter jump', () => {
    const first = reduceNudge(initialWorld(), n('Enter'), () => 0.2)
    const second = reduceNudge(first, n('Enter'), () => 0.2)
    expect(second.queue.next).toBe('jump')
    const ended = reduceActionEnd(second, () => 0.2)
    expect(ended.action).toBe('jump')
    expect(ended.seq).toBeGreaterThan(second.seq)
  })

  it('promotes queued nudges in wander mode', () => {
    const ended = reduceActionEnd(
      {
        ...initialWorld(),
        action: 'jump',
        moveMode: 'step',
        queue: { current: 'jump', next: 'jump' },
      },
      () => 0.2,
    )
    expect(ended.action).toBe('jump')
    expect(ended.moveMode).toBe('wander')
  })
})
