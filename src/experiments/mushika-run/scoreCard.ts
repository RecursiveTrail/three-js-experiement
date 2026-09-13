import { GATES, type GateId, type ModakKind } from './constants'

export const SCORE_CARD_W = 1080
export const SCORE_CARD_H = 1920

export type EatenCounts = Record<ModakKind, number>

export type ScoreCardInput = {
  score: number
  distance: number
  eaten: EatenCounts
  gatesReached: readonly GateId[]
}

export type ScoreCardStats = {
  score: number
  distanceM: number
  eaten: EatenCounts
  gates: string[]
}

export const EMPTY_EATEN: EatenCounts = { ukadiche: 0, talniche: 0, king: 0 }

export const MODAK_LABEL: Record<ModakKind, string> = {
  ukadiche: 'Ukadiche',
  talniche: 'Talniche',
  king: 'King',
}

export function scoreCardStats(world: ScoreCardInput): ScoreCardStats {
  return {
    score: world.score,
    distanceM: Math.floor(world.distance),
    eaten: { ...world.eaten },
    gates: world.gatesReached.map((id) => GATES.find((g) => g.id === id)?.name ?? id),
  }
}

export function shareCaption(stats: ScoreCardStats): string {
  const mods = (Object.keys(MODAK_LABEL) as ModakKind[])
    .map((kind) => `${MODAK_LABEL[kind]} ${stats.eaten[kind]}`)
    .join(' · ')
  const gates = stats.gates.length > 0 ? stats.gates.join(', ') : 'none'
  return `Mushika Run — ${stats.score} pts · ${stats.distanceM}m\nModaks: ${mods}\nGates: ${gates}`
}

export function paintScoreCard(ctx: CanvasRenderingContext2D, stats: ScoreCardStats): void {
  const w = SCORE_CARD_W
  const h = SCORE_CARD_H
  ctx.fillStyle = '#1a0c10'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#f0c070'
  ctx.lineWidth = 14
  ctx.strokeRect(48, 48, w - 96, h - 96)

  ctx.fillStyle = '#ffc53d'
  ctx.textAlign = 'center'
  ctx.font = '700 52px system-ui, sans-serif'
  ctx.fillText('MUSHIKA RUN', w / 2, 180)
  ctx.fillStyle = '#fff8e8'
  ctx.font = '600 40px system-ui, sans-serif'
  ctx.fillText('Bhuk caught you', w / 2, 250)

  ctx.fillStyle = '#ff9a2a'
  ctx.font = '800 160px system-ui, sans-serif'
  ctx.fillText(String(stats.score), w / 2, 460)
  ctx.fillStyle = '#fff8e8'
  ctx.font = '600 36px system-ui, sans-serif'
  ctx.fillText('score', w / 2, 520)

  ctx.font = '700 56px system-ui, sans-serif'
  ctx.fillText(`${stats.distanceM} m covered`, w / 2, 640)

  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffc53d'
  ctx.font = '700 40px system-ui, sans-serif'
  ctx.fillText('Modaks eaten', 140, 780)
  ctx.fillStyle = '#fff8e8'
  ctx.font = '600 44px system-ui, sans-serif'
  let y = 860
  for (const kind of ['ukadiche', 'talniche', 'king'] as const) {
    ctx.fillText(MODAK_LABEL[kind], 160, y)
    ctx.textAlign = 'right'
    ctx.fillText(String(stats.eaten[kind]), w - 160, y)
    ctx.textAlign = 'left'
    y += 80
  }

  ctx.fillStyle = '#ffc53d'
  ctx.font = '700 40px system-ui, sans-serif'
  ctx.fillText('Gates crossed', 140, y + 40)
  ctx.fillStyle = '#fff8e8'
  ctx.font = '600 40px system-ui, sans-serif'
  y += 120
  if (stats.gates.length === 0) {
    ctx.fillText('none yet', 160, y)
  } else {
    for (const name of stats.gates) {
      ctx.fillText(name, 160, y)
      y += 72
    }
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffc53d'
  ctx.font = '700 36px system-ui, sans-serif'
  ctx.fillText('Ganpati Bappa Morya', w / 2, h - 120)
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
      return
    }
    resolve(null)
  })
}

export async function scoreCardPngFile(stats: ScoreCardStats): Promise<File> {
  const canvas = document.createElement('canvas')
  canvas.width = SCORE_CARD_W
  canvas.height = SCORE_CARD_H
  const ctx = (() => {
    try {
      return canvas.getContext('2d')
    } catch {
      return null
    }
  })()
  if (ctx) paintScoreCard(ctx, stats)
  const fromBlob = ctx ? await canvasToBlob(canvas) : null
  const blob =
    fromBlob && fromBlob.size > 0
      ? fromBlob
      : new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' })
  return new File([blob], `mushika-run-${stats.score}.png`, { type: 'image/png' })
}

export type ShareApi = {
  share: (data: ShareData) => Promise<void>
  canShare?: (data: ShareData) => boolean
}

export type ShareResult = 'files' | 'text' | 'download'

function downloadFile(file: File): void {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  URL.revokeObjectURL(url)
}

export async function shareScoreCard(
  stats: ScoreCardStats,
  api: ShareApi | undefined = typeof navigator === 'undefined'
    ? undefined
    : { share: navigator.share?.bind(navigator), canShare: navigator.canShare?.bind(navigator) },
): Promise<ShareResult> {
  const text = shareCaption(stats)
  const title = 'Mushika Run'
  const file = await scoreCardPngFile(stats)
  const payload: ShareData = { title, text, files: [file] }
  const share = api?.share
  const canShare = api?.canShare

  try {
    if (share && (canShare ? canShare(payload) : true)) {
      await share(payload)
      return 'files'
    }
    if (share) {
      await share({ title, text })
      return 'text'
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'text'
  }
  downloadFile(file)
  return 'download'
}
