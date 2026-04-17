import * as turf from '@turf/turf'
import type { Feature, LineString } from 'geojson'

export function distanceOnRoute(
  routeGeoJSON: Feature<LineString>,
  snappedLng: number,
  snappedLat: number
): number {
  const pt = turf.point([snappedLng, snappedLat])
  const snapped = turf.nearestPointOnLine(routeGeoJSON, pt, { units: 'kilometers' })
  return snapped.properties.location ?? 0
}

export function totalRouteDistance(routeGeoJSON: Feature<LineString>): number {
  return turf.length(routeGeoJSON, { units: 'kilometers' })
}

export function totalElevationGain(elevations: (number | undefined)[]): number {
  let gain = 0
  for (let i = 1; i < elevations.length; i++) {
    const prev = elevations[i - 1]
    const curr = elevations[i]
    if (prev != null && curr != null && curr > prev) {
      gain += curr - prev
    }
  }
  return Math.round(gain)
}
