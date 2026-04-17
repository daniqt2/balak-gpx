import { PacingZone } from '@/types/pacing'
import { RoutePoint } from '@/types/route'
import { RouteMarker, POINT_CONFIG } from '@/types/points'
import { buildRouteProfile } from '@/lib/geo/routeProfile'

const PAD_X = 72
const SCALE = 2
const TOP_H = 196
const STRIP_H = 250
const BOTTOM_H = 88
const HEIGHT = TOP_H + STRIP_H + BOTTOM_H

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

function tickStep(totalKm: number) {
  if (totalKm <= 60) return 5
  if (totalKm <= 120) return 10
  if (totalKm <= 220) return 20
  return 25
}

export async function exportPacingStripImage(
  route: RoutePoint[],
  totalKm: number,
  pacingZones: PacingZone[],
  markers: RouteMarker[],
  fileName: string
): Promise<void> {
  const profile = buildRouteProfile(route).filter((point) => point.ele != null)
  if (profile.length < 2) return

  const width = Math.round(Math.max(2200, Math.min(3400, totalKm * 11 + PAD_X * 2)))
  const plotW = width - PAD_X * 2
  const stripTop = TOP_H

  const canvas = document.createElement('canvas')
  canvas.width = width * SCALE
  canvas.height = HEIGHT * SCALE
  canvas.style.width = `${width}px`
  canvas.style.height = `${HEIGHT}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(SCALE, SCALE)

  const minEle = Math.min(...profile.map((point) => point.ele!))
  const maxEle = Math.max(...profile.map((point) => point.ele!))
  const eleRange = maxEle - minEle || 1
  const profileTotalKm = profile[profile.length - 1].distKm || 1

  const xAtKm = (km: number) => PAD_X + (km / totalKm) * plotW
  const yAtEle = (ele: number) =>
    stripTop + STRIP_H - 22 - ((ele - minEle) / eleRange) * (STRIP_H - 40)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, HEIGHT)

  ctx.fillStyle = '#111111'
  ctx.font = 'bold 42px Arial, sans-serif'
  ctx.fillText(fileName.toUpperCase(), PAD_X, 58)
  ctx.fillStyle = '#6b7280'
  ctx.font = '22px Arial, sans-serif'
  ctx.fillText(`${totalKm.toFixed(0)} km`, PAD_X, 92)

  const tick = tickStep(totalKm)
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  for (let km = 0; km <= totalKm; km += tick) {
    const x = xAtKm(km)
    ctx.beginPath()
    ctx.moveTo(x, stripTop - 10)
    ctx.lineTo(x, stripTop + STRIP_H + 8)
    ctx.stroke()

    ctx.fillStyle = '#6b7280'
    ctx.font = '16px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${km}`, x, stripTop + STRIP_H + 34)
  }
  ctx.textAlign = 'left'

  pacingZones.forEach((zone) => {
    const x1 = xAtKm(zone.kmStart)
    const x2 = xAtKm(zone.kmEnd)
    ctx.fillStyle = `${zone.color}22`
    ctx.fillRect(x1, stripTop, x2 - x1, STRIP_H)

    const tagX = (x1 + x2) / 2
    ctx.fillStyle = zone.color
    ctx.beginPath()
    ctx.roundRect(tagX - 62, 114, 124, 34, 8)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(zone.label, tagX, 136)
    ctx.textAlign = 'left'
  })

  const coords = profile.map((point) => ({
    x: PAD_X + (point.distKm / profileTotalKm) * plotW,
    y: yAtEle(point.ele!),
  }))

  ctx.beginPath()
  ctx.moveTo(coords[0].x, stripTop + STRIP_H)
  coords.forEach((point) => ctx.lineTo(point.x, point.y))
  ctx.lineTo(coords[coords.length - 1].x, stripTop + STRIP_H)
  ctx.closePath()
  const gradient = ctx.createLinearGradient(0, stripTop, 0, stripTop + STRIP_H)
  gradient.addColorStop(0, 'rgba(17,17,17,0.22)')
  gradient.addColorStop(1, 'rgba(17,17,17,0.03)')
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.beginPath()
  coords.forEach((point, index) => (index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)))
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()

  const sortedMarkers = [...markers].sort((a, b) => a.distanceFromStart - b.distanceFromStart)
  sortedMarkers.forEach((marker, index) => {
    const x = xAtKm(marker.distanceFromStart)
    const cfg = POINT_CONFIG[marker.type]
    const row = index % 4
    const tagY = 18 + row * 32

    ctx.beginPath()
    ctx.moveTo(x, tagY + 26)
    ctx.lineTo(x, stripTop + STRIP_H - 6)
    ctx.strokeStyle = cfg.color
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.stroke()
    ctx.setLineDash([])

    const tag = `${cfg.emoji} ${marker.label}`
    const trimmedTag = tag.length > 22 ? `${tag.slice(0, 21)}…` : tag
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = cfg.color
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(x - 82, tagY, 164, 26, 6)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#111111'
    ctx.font = '14px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(trimmedTag, x, tagY + 17)
    ctx.textAlign = 'left'
  })

  ctx.fillStyle = '#6b7280'
  ctx.font = '18px Arial, sans-serif'
  ctx.fillText(`${Math.round(minEle)} m`, 16, stripTop + STRIP_H - 6)
  ctx.fillText(`${Math.round(maxEle)} m`, 16, stripTop + 18)

  ctx.fillStyle = '#9ca3af'
  ctx.font = '16px Arial, sans-serif'
  ctx.fillText('KM', PAD_X, HEIGHT - 22)
  ctx.textAlign = 'right'
  ctx.fillText('BALAK GPX EDITOR', width - PAD_X, HEIGHT - 22)

  downloadCanvas(canvas, `${fileName}-pacing-strip.png`)
}
