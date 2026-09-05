import { describe, expect, it } from 'vitest'
import { POT_SPAN } from './constants'
import { initialWorld, phaseDurationS, reduce, type World } from './reduce'

function seqRng(values: number[]) {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]!
}

const far = seqRng([1, 1])

function withPot(at: [number, number], extra: Partial<World> = {}): World {
  return {
    phase: 'idle',
    krishna: [0, 0, 0],
    yaw: 0,
    pot: at,
    potId: 1,
    lastSmash: null,
    smashCount: 0,
    queued: false,
    seq: 0,
    animSeq: 0,
    ...extra,
  }
}

describe('reduce', () => {
  it('starts idle with a pot not on Krishna', () => {
    const w = initialWorld(far)
    expect(w.phase).toBe('idle')
    expect(w.pot).not.toBeNull()
    expect(Math.hypot(w.pot![0], w.pot![1])).toBeGreaterThanOrEqual(1.6)
    expect(w.smashCount).toBe(0)
    expect(w.potId).toBe(1)
  })

  it('idle + jump starts a run toward the pot', () => {
    const next = reduce(withPot([2, 0]), { type: 'jump' }, far)
    expect(next.phase).toBe('run')
    expect(next.queued).toBe(false)
    expect(next.yaw).toBeCloseTo(Math.atan2(2, 0))
    expect(next.animSeq).toBe(1)
  })

  it('jump during run only sets queued', () => {
    const running = reduce(withPot([2, 0]), { type: 'jump' }, far)
    const next = reduce(running, { type: 'jump' }, far)
    expect(next.phase).toBe('run')
    expect(next.queued).toBe(true)
    expect(next.animSeq).toBe(running.animSeq)
  })

  it('run end snaps under the pot and jumps', () => {
    const running = reduce(withPot([2, 0]), { type: 'jump' }, far)
    const next = reduce(running, { type: 'end' }, far)
    expect(next.phase).toBe('jump')
    expect(next.krishna).toEqual([2, 0, 0])
  })

  it('jump end smashes without bumping potId', () => {
    const jumping = reduce(reduce(withPot([2, 0]), { type: 'jump' }, far), { type: 'end' }, far)
    const next = reduce(jumping, { type: 'end' }, far)
    expect(next.phase).toBe('break')
    expect(next.pot).toBeNull()
    expect(next.smashCount).toBe(1)
    expect(next.seq).toBe(1)
    expect(next.potId).toBe(1)
    expect(next.lastSmash).toEqual([2, 0])
  })

  it('break end goes to wait with pot still null', () => {
    let w = withPot([2, 0])
    w = reduce(w, { type: 'jump' }, far)
    w = reduce(w, { type: 'end' }, far)
    w = reduce(w, { type: 'end' }, far)
    w = reduce(w, { type: 'end' }, far)
    expect(w.phase).toBe('wait')
    expect(w.pot).toBeNull()
    expect(w.potId).toBe(1)
  })

  it('wait end without queue spawns a new pot and idles', () => {
    let w = withPot([2, 0])
    w = reduce(w, { type: 'jump' }, far)
    w = reduce(w, { type: 'end' }, far)
    w = reduce(w, { type: 'end' }, far)
    w = reduce(w, { type: 'end' }, far)
    const next = reduce(w, { type: 'end' }, seqRng([0, 0, 0, 1]))
    expect(next.phase).toBe('idle')
    expect(next.pot).not.toBeNull()
    expect(next.potId).toBe(2)
    expect(next.queued).toBe(false)
    expect(Math.hypot(next.pot![0] - 2, next.pot![1] - 0)).toBeGreaterThanOrEqual(1.6)
  })

  it('wait end with queue runs at the new pot', () => {
    let w = withPot([2, 0])
    w = reduce(w, { type: 'jump' }, far)
    w = reduce(w, { type: 'end' }, far)
    w = reduce(w, { type: 'end' }, far)
    w = reduce(w, { type: 'end' }, far)
    w = reduce(w, { type: 'jump' }, far)
    expect(w.queued).toBe(true)
    const next = reduce(w, { type: 'end' }, seqRng([0, 1]))
    expect(next.phase).toBe('run')
    expect(next.queued).toBe(false)
    expect(next.pot).not.toBeNull()
    expect(next.potId).toBe(2)
  })

  it('phaseDurationS is null while idle', () => {
    expect(phaseDurationS(withPot([1, 1]))).toBeNull()
  })

  it('clamps run duration', () => {
    const running = reduce(withPot([POT_SPAN, POT_SPAN]), { type: 'jump' }, far)
    const d = phaseDurationS(running)
    expect(d).toBeGreaterThanOrEqual(0.25)
    expect(d).toBeLessThanOrEqual(0.8)
  })
})
