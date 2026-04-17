export type PointType =
  | 'puerto'
  | 'parada'
  | 'peligro'
  | 'inicio_subida'
  | 'avituallamiento'
  | 'nota'

export interface RouteMarker {
  id: string
  type: PointType
  label: string
  lat: number
  lon: number
  distanceFromStart: number
}

export const POINT_CONFIG: Record<
  PointType,
  { label: string; color: string; emoji: string }
> = {
  puerto: { label: 'Puerto', color: '#f59e0b', emoji: '⛰' },
  parada: { label: 'Parada / Cafetería', color: '#3b82f6', emoji: '☕' },
  peligro: { label: 'Peligro', color: '#ef4444', emoji: '⚠️' },
  inicio_subida: { label: 'Inicio subida', color: '#a855f7', emoji: '📈' },
  avituallamiento: { label: 'Avituallamiento', color: '#22c55e', emoji: '🍌' },
  nota: { label: 'Nota', color: '#6b7280', emoji: '📝' },
}
