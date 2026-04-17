import { RoutePoint } from '@/types/route'

const EARTH_RADIUS_KM = 6371

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function distanceBetweenPoints(a: RoutePoint, b: RoutePoint) {
  const dLat = toRadians(b.lat - a.lat)
  const dLon = toRadians(b.lon - a.lon)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

export interface RouteProfilePoint extends RoutePoint {
  distKm: number
}

export function buildRouteProfile(route: RoutePoint[]): RouteProfilePoint[] {
  let distKm = 0

  return route.map((point, index) => {
    if (index > 0) {
      distKm += distanceBetweenPoints(route[index - 1], point)
    }

    return { ...point, distKm }
  })
}
