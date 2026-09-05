import { describe, expect, it } from 'vitest'
import {
  ALL_PLAYABLE,
  FAMILY_ACTIONS,
  advanceQueue,
  emptyQueue,
  offerReaction,
  pickReaction,
} from './reactionPicker'
import type { Nudge } from './reactionPicker'

function seq(values: number[]): () => number {
  let i = 0
  return () => {
    const v = values[i] ?? 0
    i += 1
    return v
  }
}

const nudge = (family: Nudge['family']): Nudge => ({ key: 'x', family, at: 0 })

describe('pickReaction', () => {
  it('returns ignore when first roll is below 0.15', () => {
    expect(pickReaction(nudge('voice'), seq([0.0, 0]))).toBe('ignore')
    expect(pickReaction(nudge('voice'), seq([0.149, 0]))).toBe('ignore')
  })

  it('picks from the family pool in the 55% band', () => {
    expect(pickReaction(nudge('voice'), seq([0.15, 0]))).toBe(FAMILY_ACTIONS.voice[0])
    expect(pickReaction(nudge('jump'), seq([0.69, 0]))).toBe(FAMILY_ACTIONS.jump[0])
  })

  it('picks a non-family action in the 30% band', () => {
    const action = pickReaction(nudge('voice'), seq([0.70, 0]))
    expect(FAMILY_ACTIONS.voice).not.toContain(action)
    expect(ALL_PLAYABLE).toContain(action)
  })

  it('uses ALL_PLAYABLE for wild family in the 55% band', () => {
    const action = pickReaction(nudge('wild'), seq([0.2, 0]))
    expect(ALL_PLAYABLE).toContain(action)
  })
})

describe('offerReaction / advanceQueue', () => {
  it('fills current when empty', () => {
    expect(offerReaction(emptyQueue(), 'walk')).toEqual({ current: 'walk', next: null })
  })

  it('replaces next and never grows past one queued action', () => {
    let q = offerReaction(emptyQueue(), 'walk')
    q = offerReaction(q, 'jump')
    q = offerReaction(q, 'meow')
    expect(q).toEqual({ current: 'walk', next: 'meow' })
  })

  it('promotes next on advance', () => {
    let q = offerReaction(emptyQueue(), 'walk')
    q = offerReaction(q, 'jump')
    expect(advanceQueue(q)).toEqual({ current: 'jump', next: null })
  })
})
