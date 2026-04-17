import type { Feature, LineString } from 'geojson'
import { PacingZone } from '@/types/pacing'
import { RoutePoint } from '@/types/route'
import { sliceRouteByKm } from '@/lib/geo/sliceRoute'
import { buildRouteProfile } from '@/lib/geo/routeProfile'

const W = 1400
const MAP_H = 560
const ELEV_H = 120
const LEGEND_H = 80
const TOTAL_H = MAP_H + ELEV_H + LEGEND_H
const PAD = 48
const TILE_SIZE = 256

function lonToTileX(lon: number, z: number) {
  return ((lon + 180) / 360) * Math.pow(2, z)
}

function latToTileY(lat: number, z: number) {
  const sinLat = Math.sin((lat * Math.PI) / 180)
  return (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * Math.pow(2, z)
}

function pickZoom(lons: number[], lats: number[]): number {
  const minLon = Math.min(...lons), maxLon = Math.max(...lons)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  for (let z = 13; z >= 5; z--) {
    const tilesX = Math.ceil(lonToTileX(maxLon, z)) - Math.floor(lonToTileX(minLon, z)) + 3
    const tilesY = Math.ceil(latToTileY(minLat, z)) - Math.floor(latToTileY(maxLat, z)) + 3
    if (tilesX * tilesY <= 64) return z
  }
  return 6
}

function loadImg(url: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export async function exportPacingImage(
  routeGeoJSON: Feature<LineString>,
  pacingZones: PacingZone[],
  route: RoutePoint[],
  totalKm: number,
  ftp: number,
  fileName: string
): Promise<void> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = TOTAL_H
  const ctx = canvas.getContext('2d')!

  const coords = routeGeoJSON.geometry.coordinates as number[][]
  const lons = coords.map(c => c[0])
  const lats = coords.map(c => c[1])
  const minLon = Math.min(...lons), maxLon = Math.max(...lons)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)

  // ── Background ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#111'
  ctx.fillRect(0, 0, W, TOTAL_H)

  // ── Fetch OSM tiles ─────────────────────────────────────────────────────
  const zoom = pickZoom(lons, lats)
  const minTX = lonToTileX(minLon, zoom), maxTX = lonToTileX(maxLon, zoom)
  const minTY = latToTileY(maxLat, zoom), maxTY = latToTileY(minLat, zoom)

  const txStart = Math.floor(minTX) - 1, txEnd = Math.floor(maxTX) + 1
  const tyStart = Math.floor(minTY) - 1, tyEnd = Math.floor(maxTY) + 1

  const routeTW = maxTX - minTX, routeTH = maxTY - minTY
  const scaleX = (W - PAD * 2) / (routeTW * TILE_SIZE)
  const scaleY = (MAP_H - PAD * 2) / (routeTH * TILE_SIZE)
  const tileScale = Math.min(scaleX, scaleY)

  const scaledW = routeTW * TILE_SIZE * tileScale
  const scaledH = routeTH * TILE_SIZE * tileScale
  const ox = PAD + ((W - PAD * 2) - scaledW) / 2
  const oy = PAD + ((MAP_H - PAD * 2) - scaledH) / 2

  // Build tile spec list, load all in parallel, then draw
  const tileSpecs: { tx: number; ty: number; cx: number; cy: number; ts: number }[] = []
  for (let tx = txStart; tx <= txEnd; tx++) {
    for (let ty = tyStart; ty <= tyEnd; ty++) {
      tileSpecs.push({
        tx, ty,
        cx: ox + (tx - minTX) * TILE_SIZE * tileScale,
        cy: oy + (ty - minTY) * TILE_SIZE * tileScale,
        ts: TILE_SIZE * tileScale,
      })
    }
  }

  const tileImages = await Promise.all(
    tileSpecs.map(s => loadImg(`https://tile.openstreetmap.org/${zoom}/${s.tx}/${s.ty}.png`))
  )

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, W, MAP_H)
  ctx.clip()

  // Draw tiles at reduced opacity → dark terrain aesthetic on black bg
  ctx.globalAlpha = 0.45
  tileSpecs.forEach((s, i) => {
    if (tileImages[i]) ctx.drawImage(tileImages[i]!, s.cx, s.cy, s.ts, s.ts)
  })
  ctx.globalAlpha = 1

  // coord → canvas pixel
  const toPixel = (lon: number, lat: number) => ({
    x: ox + (lonToTileX(lon, zoom) - minTX) * TILE_SIZE * tileScale,
    y: oy + (latToTileY(lat, zoom) - minTY) * TILE_SIZE * tileScale,
  })

  const px = coords.map(c => toPixel(c[0], c[1]))

  // ── Base route (dim) ─────────────────────────────────────────────────────
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  px.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.stroke()

  // ── Pacing zone colored segments ─────────────────────────────────────────
  pacingZones.forEach(zone => {
    let slice: { x: number; y: number }[]
    try {
      slice = sliceRouteByKm(routeGeoJSON, zone.kmStart, zone.kmEnd)
        .geometry.coordinates
        .map(([lon, lat]) => toPixel(lon, lat))
    } catch {
      return
    }
    if (slice.length < 2) return
    ctx.beginPath()
    ctx.strokeStyle = zone.color
    ctx.lineWidth = 6
    slice.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.stroke()
    ctx.beginPath()
    ctx.fillStyle = zone.color
    ctx.arc(slice[0].x, slice[0].y, 7, 0, Math.PI * 2)
    ctx.fill()
  })

  // Start / end dots
  if (px.length) {
    ctx.beginPath(); ctx.fillStyle = '#22c55e'
    ctx.arc(px[0].x, px[0].y, 9, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.fillStyle = '#e94560'
    ctx.arc(px[px.length - 1].x, px[px.length - 1].y, 9, 0, Math.PI * 2); ctx.fill()
  }

  ctx.restore()

  // ── Route name ────────────────────────────────────────────────────────────
  ctx.font = 'bold 28px Arial, sans-serif'
  ctx.fillStyle = '#fff'
  ctx.fillText(fileName.toUpperCase(), 32, 44)
  ctx.font = '13px Arial, sans-serif'
  ctx.fillStyle = '#555'
  ctx.fillText(`${totalKm.toFixed(0)} km`, 32, 66)

  // ── BALAK watermark ───────────────────────────────────────────────────────
  ctx.font = 'bold 22px Arial, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.textAlign = 'right'
  ctx.fillText('BALAK', W - 28, MAP_H - 20)
  ctx.textAlign = 'left'

  // ── Elevation strip ───────────────────────────────────────────────────────
  const elevY = MAP_H
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, elevY, W, ELEV_H)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, elevY); ctx.lineTo(W, elevY); ctx.stroke()

  const elevPts = buildRouteProfile(route).filter(p => p.ele != null)
  if (elevPts.length > 1) {
    const minE = Math.min(...elevPts.map(p => p.ele!))
    const maxE = Math.max(...elevPts.map(p => p.ele!))
    const range = maxE - minE || 1
    const eW = W - PAD * 2, eH = ELEV_H - 24
    const profileTotalKm = elevPts[elevPts.length - 1].distKm || 1
    const elevCoords = elevPts.map((p) => ({
      x: PAD + (p.distKm / profileTotalKm) * eW,
      y: elevY + ELEV_H - 12 - ((p.ele! - minE) / range) * eH,
    }))
    pacingZones.forEach(zone => {
      const x1 = PAD + (zone.kmStart / totalKm) * eW
      const x2 = PAD + (zone.kmEnd / totalKm) * eW
      ctx.fillStyle = zone.color + '30'
      ctx.fillRect(x1, elevY + 4, x2 - x1, ELEV_H - 8)
    })
    ctx.beginPath()
    ctx.moveTo(elevCoords[0].x, elevY + ELEV_H)
    elevCoords.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(elevCoords[elevCoords.length - 1].x, elevY + ELEV_H)
    ctx.closePath()
    const grad = ctx.createLinearGradient(0, elevY, 0, elevY + ELEV_H)
    grad.addColorStop(0, 'rgba(233,69,96,0.35)')
    grad.addColorStop(1, 'rgba(233,69,96,0)')
    ctx.fillStyle = grad; ctx.fill()
    ctx.beginPath()
    ctx.strokeStyle = '#e94560'; ctx.lineWidth = 2
    elevCoords.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.stroke()
  }

  // ── Legend ────────────────────────────────────────────────────────────────
  const legY = MAP_H + ELEV_H
  ctx.fillStyle = '#161616'; ctx.fillRect(0, legY, W, LEGEND_H)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, legY); ctx.lineTo(W, legY); ctx.stroke()

  const colW = Math.min(220, (W - PAD * 2) / Math.max(pacingZones.length, 1))
  pacingZones.forEach((zone, i) => {
    const lx = PAD + i * colW
    const ly = legY + 18
    ctx.fillStyle = zone.color; ctx.fillRect(lx, ly, 4, 40)
    ctx.font = 'bold 13px Arial, sans-serif'; ctx.fillStyle = '#fff'
    ctx.fillText(zone.label, lx + 12, ly + 14)
    ctx.font = 'bold 16px Arial, sans-serif'; ctx.fillStyle = zone.color
    ctx.fillText(`${zone.watts}w`, lx + 12, ly + 32)
    if (ftp > 0) {
      ctx.font = '11px Arial, sans-serif'; ctx.fillStyle = '#666'
      ctx.fillText(`${Math.round((zone.watts / ftp) * 100)}% FTP`, lx + 12 + 52, ly + 32)
    }
    ctx.font = '11px Arial, sans-serif'; ctx.fillStyle = '#555'
    ctx.fillText(`km ${zone.kmStart}–${zone.kmEnd}`, lx + 12, ly + 48)
  })

  ctx.font = 'bold 14px Arial, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.textAlign = 'right'
  ctx.fillText('BALAK GPX EDITOR', W - PAD, legY + LEGEND_H - 16)
  ctx.textAlign = 'left'

  // ── Download ──────────────────────────────────────────────────────────────
  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}-pacing.png`
    a.click()
    URL.revokeObjectURL(url)
  })
}
