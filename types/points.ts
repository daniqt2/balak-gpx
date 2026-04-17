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
  { label: string; color: string; emoji: string; garminSym: string }
> = {
  puerto:          { label: 'Puerto',             color: '#f59e0b', emoji: '⛰',  garminSym: 'Summit'      },
  parada:          { label: 'Parada / Cafetería', color: '#3b82f6', emoji: '☕', garminSym: 'Restaurant'  },
  peligro:         { label: 'Peligro',            color: '#ef4444', emoji: '⚠️', garminSym: 'Danger Area' },
  inicio_subida:   { label: 'Inicio subida',      color: '#a855f7', emoji: '📈', garminSym: 'Flag, Blue'  },
  avituallamiento: { label: 'Avituallamiento',    color: '#22c55e', emoji: '🍌', garminSym: 'Snack Bar'   },
  nota:            { label: 'Nota',               color: '#6b7280', emoji: '📝', garminSym: 'Information' },
}
