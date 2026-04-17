import * as turf from '@turf/turf'
import type { Feature, LineString } from 'geojson'

export function sliceRouteByKm(
  routeGeoJSON: Feature<LineString>,
  kmStart: number,
  kmEnd: number
): Feature<LineString> {
  const start = turf.along(routeGeoJSON, kmStart, { units: 'kilometers' })
  const end = turf.along(routeGeoJSON, kmEnd, { units: 'kilometers' })
  return turf.lineSlice(start, end, routeGeoJSON)
}
