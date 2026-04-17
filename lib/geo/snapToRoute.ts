import * as turf from '@turf/turf'
import type { Feature, LineString } from 'geojson'

export function snapToRoute(
  clickLng: number,
  clickLat: number,
  routeGeoJSON: Feature<LineString>
): [number, number] {
  const pt = turf.point([clickLng, clickLat])
  const snapped = turf.nearestPointOnLine(routeGeoJSON, pt, { units: 'kilometers' })
  return [snapped.geometry.coordinates[0], snapped.geometry.coordinates[1]]
}
