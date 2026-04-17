import { RoutePoint } from './route'
import { RouteMarker } from './points'
import type { Feature, LineString } from 'geojson'

export interface EditorState {
  route: RoutePoint[] | null
  routeGeoJSON: Feature<LineString> | null
  markers: RouteMarker[]
  fileName: string | null
}
