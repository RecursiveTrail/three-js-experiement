import { describe, expect, it } from 'vitest'
import { assetUrl } from '../../shared/assetUrl'
import {
  DRAIN_PER_SECOND,
  GATES,
  PASS_M,
  bhukPose,
  doorOpenT,
  drainPerSecond,
  flowerPalette,
  hudGateLine,
  jumpY,
  laneX,
  lastGateLabel,
  liveGateId,
  nearFlowerGate,
  nextGateLine,
  resumeDistance,
  shrineStillUrl,
  shrineVideoUrl,
  worldZ,
} from './constants'

describe('drainPerSecond', () => {
  it('is 0.10/s with 0 gates', () => {
    expect(drainPerSecond(0)).toBeCloseTo(0.1)
  })

  it('multiplies by 1.15 after 1 gate', () => {
    expect(drainPerSecond(1)).toBeCloseTo(0.1 * 1.15)
  })

  it('caps at the fifth-gate rate', () => {
    expect(drainPerSecond(5)).toBeCloseTo(DRAIN_PER_SECOND * 1.15 ** 5)
    expect(drainPerSecond(6)).toBeCloseTo(drainPerSecond(5))
  })
})

describe('nextGateLine', () => {
  it('shows the first gate with remaining metres', () => {
    expect(nextGateLine(0)).toBe('Siddhivinayak · 80m')
    expect(nextGateLine(79.2)).toBe('Siddhivinayak · 1m')
  })

  it('uses beyond copy after Lalbaugcha Raja', () => {
    expect(nextGateLine(600)).toBe('beyond Lalbaugcha Raja')
    expect(nextGateLine(900)).toBe('beyond Lalbaugcha Raja')
  })
})

describe('lastGateLabel', () => {
  it('is none before any gate', () => {
    expect(lastGateLabel([])).toBe('none')
  })

  it('uses the last reached name', () => {
    expect(lastGateLabel(['siddhivinayak', 'andhericha-raja'])).toBe('Andhericha Raja')
  })
})

describe('jumpY and worldZ', () => {
  it('is 0 on the ground and ~0.7 at apex', () => {
    expect(jumpY(null)).toBe(0)
    expect(jumpY(0)).toBeCloseTo(0)
    expect(jumpY(0.5)).toBeCloseTo(0.7)
    expect(jumpY(1)).toBeCloseTo(0)
  })

  it('places ahead in -Z', () => {
    expect(worldZ(20, 0)).toBeCloseTo(-20)
    expect(worldZ(80, 80)).toBeCloseTo(0)
  })
})

describe('laneX', () => {
  it('places lanes 1.3 m apart', () => {
    expect(laneX(-1)).toBeCloseTo(-1.3)
    expect(laneX(0)).toBe(0)
    expect(laneX(1)).toBeCloseTo(1.3)
  })
})

describe('bhukPose', () => {
  it('keeps hunger 1 almost off-screen, 0.2 in the bottom third, 0 swallowing', () => {
    const full = bhukPose(1)
    const mid = bhukPose(0.5)
    const low = bhukPose(0.2)
    const empty = bhukPose(0)
    expect(full.z).toBeGreaterThan(5.5)
    expect(full.scale).toBeLessThan(1.2)
    expect(low.z).toBeGreaterThan(4.4)
    expect(low.z).toBeLessThan(5.3)
    expect(low.scale).toBeGreaterThan(1.3)
    expect(low.scale).toBeLessThan(1.9)
    expect(empty.z).toBeLessThan(1.2)
    expect(empty.scale).toBeGreaterThan(3.2)
    expect(full.z).toBeGreaterThan(mid.z)
    expect(mid.z).toBeGreaterThan(low.z)
    expect(low.z).toBeGreaterThan(empty.z)
    expect(full.scale).toBeLessThan(mid.scale)
    expect(mid.scale).toBeLessThan(low.scale)
    expect(low.scale).toBeLessThan(empty.scale)
    expect(mid.z - low.z).toBeGreaterThan(full.z - mid.z)
  })
})

describe('GATES', () => {
  it('has five named thresholds', () => {
    expect(GATES.map((g) => [g.id, g.distance])).toEqual([
      ['siddhivinayak', 80],
      ['andhericha-raja', 180],
      ['dagadusheth', 300],
      ['kasba-ganpati', 440],
      ['lalbaugcha-raja', 600],
    ])
  })
})

describe('flowerPalette', () => {
  it('uses marigold then jasmine then mixed festival', () => {
    expect(flowerPalette(0).stretch).toBe('marigold')
    expect(flowerPalette(79.9).stretch).toBe('marigold')
    expect(flowerPalette(80).stretch).toBe('jasmine')
    expect(flowerPalette(81).stretch).toBe('jasmine')
    expect(flowerPalette(180).stretch).toBe('hibiscus')
    expect(flowerPalette(300).stretch).toBe('lotus')
    expect(flowerPalette(440).stretch).toBe('rose')
    expect(flowerPalette(600).stretch).toBe('mixed')
    expect(flowerPalette(601).stretch).toBe('mixed')
  })

  it('includes the locked hex colors', () => {
    expect(flowerPalette(0).colors).toEqual(['#ffc53d', '#ff8a1a', '#5ea04a'])
    expect(flowerPalette(81).colors[0]).toBe('#f4f0d8')
  })
})

describe('nearFlowerGate', () => {
  it('clears 10 m around each gate distance', () => {
    expect(nearFlowerGate(80)).toBe(true)
    expect(nearFlowerGate(70.1)).toBe(true)
    expect(nearFlowerGate(50)).toBe(false)
  })
})

describe('liveGateId and resumeDistance', () => {
  it('uses the last reached gate', () => {
    expect(liveGateId([])).toBeUndefined()
    expect(liveGateId(['siddhivinayak'])).toBe('siddhivinayak')
    expect(resumeDistance(['siddhivinayak'])).toBeCloseTo(80 + PASS_M)
    expect(resumeDistance(['siddhivinayak', 'andhericha-raja', 'dagadusheth', 'kasba-ganpati', 'lalbaugcha-raja'])).toBeCloseTo(602.5)
  })
})

describe('hudGateLine', () => {
  it('is the name only during opening', () => {
    expect(hudGateLine('opening', 80, ['siddhivinayak'])).toBe('Siddhivinayak')
  })

  it('is empty during shrine so the top-right does not repeat the name', () => {
    expect(hudGateLine('shrine', 80, ['siddhivinayak'])).toBe('')
  })

  it('uses nextGateLine while playing', () => {
    expect(hudGateLine('playing', 0, [])).toBe('Siddhivinayak · 80m')
    expect(hudGateLine('playing', 602.5, ['lalbaugcha-raja'])).toBe('beyond Lalbaugcha Raja')
  })
})

describe('doorOpenT', () => {
  it('is 0 closed, openingT on the live gate, 1 after reached', () => {
    expect(doorOpenT({ id: 'siddhivinayak', reached: false, phase: 'playing', openingT: null, liveId: undefined })).toBe(0)
    expect(doorOpenT({ id: 'siddhivinayak', reached: true, phase: 'opening', openingT: 0.5, liveId: 'siddhivinayak' })).toBeCloseTo(0.5)
    expect(doorOpenT({ id: 'andhericha-raja', reached: false, phase: 'opening', openingT: 0.5, liveId: 'siddhivinayak' })).toBe(0)
    expect(doorOpenT({ id: 'siddhivinayak', reached: true, phase: 'playing', openingT: null, liveId: 'siddhivinayak' })).toBe(1)
  })
})

describe('shrine urls', () => {
  it('points at local shrines/{id} files', () => {
    expect(shrineVideoUrl('lalbaugcha-raja')).toBe(assetUrl('assets/mushika-run/shrines/lalbaugcha-raja.mp4'))
    expect(shrineStillUrl('siddhivinayak')).toBe(assetUrl('assets/mushika-run/shrines/siddhivinayak.jpg'))
  })
})
