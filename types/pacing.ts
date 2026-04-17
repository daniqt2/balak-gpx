export interface PacingZone {
  id: string
  kmStart: number
  kmEnd: number
  watts: number
  label: string
  color: string
}

export const ZONE_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]
