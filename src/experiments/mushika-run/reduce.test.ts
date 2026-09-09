import { describe, expect, it } from 'vitest'
import { SPEED } from './constants'
import { initialSnapshot, reduce, type Modak, type Snapshot } from './reduce'

function seqRng(values: number[]) {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]!
}

const quiet = seqRng([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

function playing(extra: Partial<Snapshot> = {}): Snapshot {
  return { ...initialSnapshot(), ...extra }
}

describe('tick motion and hunger', () => {
  it('adds 10 m/s to distance', () => {
    const next = reduce(playing(), { type: 'tick', dt: 0.5 }, quiet)
    expect(next.distance).toBeCloseTo(SPEED * 0.5)
  })

  it('drains 0.10/s with no gates', () => {
    const next = reduce(playing({ hunger: 1 }), { type: 'tick', dt: 1 }, quiet)
    expect(next.hunger).toBeCloseTo(0.9)
    expect(next.phase).toBe('playing')
  })

  it('goes over at hunger 0 and further ticks freeze distance', () => {
    const dead = reduce(playing({ hunger: 0.01 }), { type: 'tick', dt: 1 }, quiet)
    expect(dead.phase).toBe('over')
    expect(dead.hunger).toBe(0)
    expect(dead.cue).toBe('rumble')
    const later = reduce(dead, { type: 'tick', dt: 1 }, quiet)
    expect(later.distance).toBe(dead.distance)
    expect(later.phase).toBe('over')
  })

  it('uses 1.15× drain after one gate and caps after five', () => {
    const after1 = reduce(
      playing({ hunger: 1, gatesReached: ['siddhivinayak'] }),
      { type: 'tick', dt: 1 },
      quiet,
    )
    expect(after1.hunger).toBeCloseTo(1 - 0.1 * 1.15)
    const five = ['siddhivinayak', 'andhericha-raja', 'dagadusheth', 'kasba-ganpati', 'lalbaugcha-raja'] as const
    const a = reduce(playing({ hunger: 1, gatesReached: [...five] }), { type: 'tick', dt: 1 }, quiet)
    const b = reduce(playing({ hunger: 1, gatesReached: [...five, 'siddhivinayak'] }), { type: 'tick', dt: 1 }, quiet)
    expect(a.hunger).toBeCloseTo(b.hunger)
  })
})

describe('lanes and jump', () => {
  it('clamps lane to -1 | 0 | 1', () => {
    expect(reduce(playing({ lane: -1 }), { type: 'laneLeft' }, quiet).lane).toBe(-1)
    expect(reduce(playing({ lane: 1 }), { type: 'laneRight' }, quiet).lane).toBe(1)
    expect(reduce(playing({ lane: 0 }), { type: 'laneLeft' }, quiet).lane).toBe(-1)
  })

  it('starts a hop only on the ground and ignores double-jump', () => {
    const hop = reduce(playing(), { type: 'jump' }, quiet)
    expect(hop.jumpT).toBe(0)
    expect(reduce(hop, { type: 'jump' }, quiet).jumpT).toBe(0)
    const mid = reduce(playing({ jumpT: 0 }), { type: 'tick', dt: 0.225 }, quiet)
    expect(mid.jumpT).toBeCloseTo(0.5)
    const land = reduce(playing({ jumpT: 0.9 }), { type: 'tick', dt: 0.1 }, quiet)
    expect(land.jumpT).toBeNull()
  })
})

describe('collect', () => {
  it('collects a matching ground modak and clamps hunger to 1', () => {
    const next = reduce(
      playing({
        lane: 0,
        hunger: 0.9,
        distance: 10,
        modaks: [{ id: 1, kind: 'king', lane: 0, high: false, atDistance: 10 }],
      }),
      { type: 'tick', dt: 0 },
      quiet,
    )
    expect(next.score).toBe(50)
    expect(next.hunger).toBe(1)
    expect(next.modaks.some((m) => m.id === 1)).toBe(false)
    expect(next.cue).toBe('nibble')
    expect(next.seq).toBe(1)
  })

  it('ignores the wrong lane', () => {
    const next = reduce(
      playing({
        lane: 1,
        distance: 10,
        modaks: [{ id: 1, kind: 'ukadiche', lane: 0, high: false, atDistance: 10 }],
      }),
      { type: 'tick', dt: 0 },
      quiet,
    )
    expect(next.score).toBe(0)
    expect(next.modaks.some((m) => m.id === 1)).toBe(true)
  })

  it('ignores a high modak unless jumpT is near apex', () => {
    const m: Modak = { id: 1, kind: 'talniche', lane: 0, high: true, atDistance: 10 }
    const grounded = reduce(playing({ distance: 10, jumpT: null, modaks: [m] }), { type: 'tick', dt: 0 }, quiet)
    expect(grounded.modaks.some((x) => x.id === 1)).toBe(true)
    const early = reduce(playing({ distance: 10, jumpT: 0.2, modaks: [m] }), { type: 'tick', dt: 0 }, quiet)
    expect(early.modaks.some((x) => x.id === 1)).toBe(true)
    const apex = reduce(playing({ distance: 10, jumpT: 0.5, modaks: [m] }), { type: 'tick', dt: 0 }, quiet)
    expect(apex.modaks.some((x) => x.id === 1)).toBe(false)
    expect(apex.score).toBe(25)
  })
})

describe('gates', () => {
  it('awards Siddhivinayak once at 80 m and starts a celebration', () => {
    const hit = reduce(playing({ distance: 79, hunger: 0.8 }), { type: 'tick', dt: 0.2 }, quiet)
    expect(hit.distance).toBeCloseTo(81)
    expect(hit.gatesReached).toEqual(['siddhivinayak'])
    expect(hit.score).toBe(100)
    expect(hit.cue).toBe('bell')
    expect(hit.celebrateT).toBe(0)
    expect(hit.jumpT).toBeNull()
    const later = reduce(hit, { type: 'tick', dt: 1 }, quiet)
    expect(later.gatesReached).toEqual(['siddhivinayak'])
    expect(later.hunger).toBeCloseTo(0.8)
    expect(later.celebrateT).toBeGreaterThan(0)
    expect(later.celebrateT).toBeLessThan(1)
  })

  it('does not collect modaks or take a player jump during celebration', () => {
    const next = reduce(
      playing({
        celebrateT: 0.2,
        lane: 0,
        hunger: 0.5,
        distance: 81,
        score: 100,
        gatesReached: ['siddhivinayak'],
        modaks: [{ id: 1, kind: 'king', lane: 0, high: false, atDistance: 81 }],
      }),
      { type: 'tick', dt: 0 },
      quiet,
    )
    expect(next.modaks.some((m) => m.id === 1)).toBe(true)
    expect(next.score).toBe(100)
    expect(next.hunger).toBe(0.5)
    expect(reduce(next, { type: 'jump' }, quiet).jumpT).toBeNull()
  })

  it('ends the dance and resumes drain after 1.8 s', () => {
    const end = reduce(playing({ celebrateT: 0.9, hunger: 0.8, gatesReached: ['siddhivinayak'] }), {
      type: 'tick',
      dt: 0.3,
    }, quiet)
    expect(end.celebrateT).toBeNull()
    const after = reduce(end, { type: 'tick', dt: 1 }, quiet)
    expect(after.hunger).toBeCloseTo(0.8 - 0.1 * 1.15)
  })
})

describe('restart', () => {
  it('restores the initial snapshot from over via jump or restart', () => {
    const over = playing({
      phase: 'over',
      hunger: 0,
      score: 40,
      distance: 90,
      lane: 1,
      gatesReached: ['siddhivinayak'],
    })
    for (const ev of [{ type: 'restart' as const }, { type: 'jump' as const }]) {
      const next = reduce(over, ev, quiet)
      expect(next).toEqual(initialSnapshot())
    }
  })
})
