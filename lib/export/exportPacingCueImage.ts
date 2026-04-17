import { PacingZone } from '@/types/pacing'
import { RouteMarker, POINT_CONFIG } from '@/types/points'

const WIDTH = 240
const SCALE = 3
const PAD = 10
const HEADER_H = 54
const POINT_ROW_H = 28
const SECTION_ROW_H = 20
const FOOTER_H = 18

function paceTextColor(hexColor: string) {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#111111' : '#ffffff'
}

function downloadCanvas(canvas: HTMLCanvasElement, fileName: string) {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  })
}

function zoneAtKm(pacingZones: PacingZone[], km: number) {
  return pacingZones.find((zone) => km >= zone.kmStart && km <= zone.kmEnd) ?? null
}

function trim(text: string, maxLength: number) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}

type CueEntry =
  | { type: 'pace-start'; km: number; zone: PacingZone; height: number }
  | { type: 'marker'; km: number; marker: RouteMarker; zone: PacingZone | null; height: number }

export async function exportPacingCueImage(
  fileName: string,
  totalKm: number,
  pacingZones: PacingZone[],
  markers: RouteMarker[]
): Promise<void> {
  const sortedMarkers = [...markers].sort((a, b) => a.distanceFromStart - b.distanceFromStart)
  const entries: CueEntry[] = [
    ...pacingZones.map((zone) => (
      { type: 'pace-start', km: zone.kmStart, zone, height: SECTION_ROW_H } as const
    )),
    ...sortedMarkers.map((marker) => ({
      type: 'marker' as const,
      km: marker.distanceFromStart,
      marker,
      zone: zoneAtKm(pacingZones, marker.distanceFromStart),
      height: POINT_ROW_H,
    })),
  ].sort((a, b) => {
    if (a.km !== b.km) return a.km - b.km
    if (a.type === b.type) return 0
    if (a.type === 'pace-start') return -1
    if (b.type === 'pace-start') return 1
    if (a.type === 'marker') return -1
    if (b.type === 'marker') return 1
    return 0
  })

  const rowsHeight = entries.length > 0
    ? entries.reduce((sum, entry) => sum + entry.height, 0)
    : POINT_ROW_H
  const height = HEADER_H + rowsHeight + FOOTER_H

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH * SCALE
  canvas.height = height * SCALE
  canvas.style.width = `${WIDTH}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(SCALE, SCALE)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, WIDTH, height)

  ctx.fillStyle = '#111111'
  ctx.font = 'bold 11px Arial, sans-serif'
  ctx.fillText(trim(fileName.toUpperCase(), 26), PAD, 16)

  ctx.fillStyle = '#4b5563'
  ctx.font = '9px Arial, sans-serif'
  ctx.fillText(`${totalKm.toFixed(0)} km`, PAD, 29)

  const tableTop = 38
  const kmColX = PAD
  const pointColX = 62

  ctx.fillStyle = '#4b5563'
  ctx.font = 'bold 8px Arial, sans-serif'
  ctx.fillText('KM', kmColX, tableTop)
  ctx.fillText('POINT', pointColX, tableTop)

  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, tableTop + 6)
  ctx.lineTo(WIDTH - PAD, tableTop + 6)
  ctx.stroke()

  if (entries.length === 0) {
    ctx.fillStyle = '#6b7280'
    ctx.font = '9px Arial, sans-serif'
    ctx.fillText('NO POINTS', PAD, tableTop + 25)
  } else {
    let currentY = tableTop + 22

    entries.forEach((entry, index) => {
      const y = currentY

      if (entry.type === 'marker') {
        const cfg = POINT_CONFIG[entry.marker.type]

        if (entry.zone) {
          ctx.fillStyle = `${entry.zone.color}22`
          ctx.fillRect(PAD - 4, y - 12, WIDTH - (PAD - 4) * 2, 22)
          ctx.fillStyle = entry.zone.color
          ctx.fillRect(PAD - 4, y - 12, 6, 22)
        } else if (index % 2 === 0) {
          ctx.fillStyle = '#f9fafb'
          ctx.fillRect(PAD - 4, y - 12, WIDTH - (PAD - 4) * 2, 22)
        }

        ctx.strokeStyle = '#e5e7eb'
        ctx.beginPath()
        ctx.moveTo(PAD, y + 13)
        ctx.lineTo(WIDTH - PAD, y + 13)
        ctx.stroke()

        ctx.fillStyle = '#111111'
        ctx.font = 'bold 10px Arial, sans-serif'
        ctx.fillText(entry.marker.distanceFromStart.toFixed(0), kmColX, y)

      ctx.fillStyle = '#374151'
      ctx.font = '9px Arial, sans-serif'
      ctx.fillText(trim(`${cfg.emoji} ${entry.marker.label}`, 20), pointColX, y)
      } else {
        ctx.fillStyle = `${entry.zone.color}33`
        ctx.fillRect(PAD - 4, y - 10, WIDTH - (PAD - 4) * 2, 16)
        ctx.fillStyle = entry.zone.color
        ctx.fillRect(PAD - 4, y - 10, WIDTH - (PAD - 4) * 2, 2)

        ctx.fillStyle = '#111111'
        ctx.font = 'bold 8px Arial, sans-serif'
        ctx.fillText(
          `${entry.zone.label} - ${entry.zone.watts}w`,
          kmColX,
          y + 1
        )
        ctx.textAlign = 'right'
        ctx.fillText(`${entry.km.toFixed(0)} km`, WIDTH - PAD, y + 1)
        ctx.textAlign = 'left'
      }

      currentY += entry.height
    })
  }

  ctx.fillStyle = '#6b7280'
  ctx.font = '7px Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('BALAK', WIDTH - PAD, height - 8)

  downloadCanvas(canvas, `${fileName}-pacing-cue.png`)
}
