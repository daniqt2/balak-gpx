import { RoutePoint } from '@/types/route'
import { RouteMarker, POINT_CONFIG } from '@/types/points'
import { PacingZone } from '@/types/pacing'
import type { Feature, LineString } from 'geojson'
import { pointAtKm } from '@/lib/geo/pointAtKm'

const PACING_DUPLICATE_KM_THRESHOLD = 0.15

interface ExportWaypoint {
  lat: number
  lon: number
  label: string
  sym: string
  type: string
  desc: string
}

function nearestEle(route: RoutePoint[], lat: number, lon: number): number | null {
  let best = Infinity, ele: number | null = null
  for (const p of route) {
    const d = (p.lat - lat) ** 2 + (p.lon - lon) ** 2
    if (d < best) { best = d; ele = p.ele ?? null }
  }
  return ele
}

export function exportGpx(
  route: RoutePoint[],
  routeGeoJSON: Feature<LineString>,
  markers: RouteMarker[],
  pacingZones: PacingZone[],
  fileName: string
): string {
  const trkpts = route
    .map((p) => {
      const ele = p.ele != null ? `\n      <ele>${p.ele.toFixed(1)}</ele>` : ''
      return `    <trkpt lat="${p.lat.toFixed(7)}" lon="${p.lon.toFixed(7)}">${ele}\n    </trkpt>`
    })
    .join('\n')

  const pacingWaypoints: ExportWaypoint[] = pacingZones
    .filter((zone) => !markers.some((marker) => Math.abs(marker.distanceFromStart - zone.kmStart) < PACING_DUPLICATE_KM_THRESHOLD))
    .map((zone) => {
      const [lon, lat] = pointAtKm(routeGeoJSON, zone.kmStart)
      return {
        lat,
        lon,
        label: `${zone.label} - ${zone.watts}w`,
        sym: 'Flag, Green',
        type: 'pacing_start',
        desc: `Pacing start · km ${zone.kmStart.toFixed(1)}`,
      }
    })

  const waypoints: ExportWaypoint[] = [
    ...markers.map((marker) => {
      const cfg = POINT_CONFIG[marker.type]
      return {
        lat: marker.lat,
        lon: marker.lon,
        label: marker.label,
        sym: cfg.garminSym,
        type: marker.type,
        desc: `km ${marker.distanceFromStart.toFixed(1)}`,
      }
    }),
    ...pacingWaypoints,
  ]

  const wpts = waypoints
    .map((waypoint) => {
      const ele = nearestEle(route, waypoint.lat, waypoint.lon)
      const eleTag = ele != null ? `\n    <ele>${ele.toFixed(1)}</ele>` : ''
      return `  <wpt lat="${waypoint.lat.toFixed(7)}" lon="${waypoint.lon.toFixed(7)}">${eleTag}
    <name>${escapeXml(waypoint.label)}</name>
    <sym>${waypoint.sym}</sym>
    <type>${waypoint.type}</type>
    <desc>${escapeXml(waypoint.desc)}</desc>
  </wpt>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="BALAK GPX Editor" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(fileName)}</name>
  </metadata>
${wpts ? wpts + '\n' : ''}  <trk>
    <name>${escapeXml(fileName)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
