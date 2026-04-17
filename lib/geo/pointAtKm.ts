import * as turf from '@turf/turf'
import type { Feature, LineString } from 'geojson'

export function pointAtKm(
  routeGeoJSON: Feature<LineString>,
  km: number
): [number, number] {
  const pt = turf.along(routeGeoJSON, km, { units: 'kilometers' })
  return [pt.geometry.coordinates[0], pt.geometry.coordinates[1]]
}
