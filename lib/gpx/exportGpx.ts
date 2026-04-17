import { RoutePoint } from '@/types/route'
import { RouteMarker, POINT_CONFIG } from '@/types/points'

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
  markers: RouteMarker[],
  fileName: string
): string {
  const trkpts = route
    .map((p) => {
      const ele = p.ele != null ? `\n      <ele>${p.ele.toFixed(1)}</ele>` : ''
      return `    <trkpt lat="${p.lat.toFixed(7)}" lon="${p.lon.toFixed(7)}">${ele}\n    </trkpt>`
    })
    .join('\n')

  const wpts = markers
    .map((m) => {
      const cfg = POINT_CONFIG[m.type]
      const ele = nearestEle(route, m.lat, m.lon)
      const eleTag = ele != null ? `\n    <ele>${ele.toFixed(1)}</ele>` : ''
      return `  <wpt lat="${m.lat.toFixed(7)}" lon="${m.lon.toFixed(7)}">${eleTag}
    <name>${escapeXml(m.label)}</name>
    <sym>${cfg.garminSym}</sym>
    <type>${m.type}</type>
    <desc>km ${m.distanceFromStart.toFixed(1)}</desc>
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
