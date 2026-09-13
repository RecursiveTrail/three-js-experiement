import { describe, expect, it, vi } from 'vitest'
import { initialSnapshot } from './reduce'
import { scoreCardStats, shareCaption, shareScoreCard } from './scoreCard'

describe('scoreCardStats', () => {
  it('floors distance, names gates, and copies eaten counts', () => {
    const stats = scoreCardStats({
      score: 175,
      distance: 91.8,
      eaten: { ukadiche: 3, talniche: 1, king: 0 },
      gatesReached: ['siddhivinayak'],
    })
    expect(stats).toEqual({
      score: 175,
      distanceM: 91,
      eaten: { ukadiche: 3, talniche: 1, king: 0 },
      gates: ['Siddhivinayak'],
    })
  })

  it('starts empty from the initial snapshot', () => {
    const stats = scoreCardStats(initialSnapshot())
    expect(stats.score).toBe(0)
    expect(stats.distanceM).toBe(0)
    expect(stats.eaten).toEqual({ ukadiche: 0, talniche: 0, king: 0 })
    expect(stats.gates).toEqual([])
  })
})

describe('shareCaption', () => {
  it('packs score, distance, modak types, and gates for social text', () => {
    const text = shareCaption({
      score: 175,
      distanceM: 91,
      eaten: { ukadiche: 3, talniche: 1, king: 0 },
      gates: ['Siddhivinayak'],
    })
    expect(text).toContain('175')
    expect(text).toContain('91m')
    expect(text).toContain('Ukadiche 3')
    expect(text).toContain('Talniche 1')
    expect(text).toContain('King 0')
    expect(text).toContain('Siddhivinayak')
  })

  it('says none when no gate was crossed', () => {
    expect(
      shareCaption({
        score: 10,
        distanceM: 12,
        eaten: { ukadiche: 1, talniche: 0, king: 0 },
        gates: [],
      }),
    ).toMatch(/Gates: none/i)
  })
})

describe('shareScoreCard', () => {
  const stats = scoreCardStats({
    score: 40,
    distance: 20,
    eaten: { ukadiche: 1, talniche: 0, king: 0 },
    gatesReached: [],
  })

  it('shares the score-card PNG when the browser accepts files', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const canShare = vi.fn().mockReturnValue(true)
    const result = await shareScoreCard(stats, { share, canShare })
    expect(result).toBe('files')
    expect(share).toHaveBeenCalledTimes(1)
    const payload = share.mock.calls[0]![0] as ShareData
    expect(payload.files).toHaveLength(1)
    expect(payload.files![0]!.type).toBe('image/png')
    expect(payload.text).toContain('40')
  })

  it('falls back to text share when files are not allowed', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const canShare = vi.fn().mockReturnValue(false)
    const result = await shareScoreCard(stats, { share, canShare })
    expect(result).toBe('text')
    expect(share.mock.calls[0]![0].files).toBeUndefined()
    expect(share.mock.calls[0]![0].text).toContain('40')
  })
})
