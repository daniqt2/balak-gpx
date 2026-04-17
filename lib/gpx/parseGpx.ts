import { RoutePoint } from '@/types/route'

export function parseGpx(text: string): RoutePoint[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'application/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) throw new Error('Archivo GPX no válido')

  const trkpts = doc.querySelectorAll('trkpt')
  if (trkpts.length === 0) throw new Error('No se encontró ninguna ruta en el archivo GPX')

  const points: RoutePoint[] = []
  trkpts.forEach((pt) => {
    const lat = parseFloat(pt.getAttribute('lat') ?? '')
    const lon = parseFloat(pt.getAttribute('lon') ?? '')
    if (isNaN(lat) || isNaN(lon)) return
    const eleEl = pt.querySelector('ele')
    const ele = eleEl ? parseFloat(eleEl.textContent ?? '') : undefined
    points.push({ lat, lon, ele: isNaN(ele!) ? undefined : ele })
  })

  if (points.length < 2) throw new Error('La ruta tiene muy pocos puntos')
  return points
}

export function routeToGeoJSON(points: RoutePoint[]) {
  return {
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: points.map((p) => [p.lon, p.lat, ...(p.ele != null ? [p.ele] : [])]),
    },
    properties: {},
  }
}
