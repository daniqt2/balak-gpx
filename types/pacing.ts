import type { Lang } from '@/lib/i18n'

export interface PacingZone {
  id: string
  kmStart: number
  kmEnd: number
  value: string
  unit: 'w' | 'bpm' | '%'
  label: string
  color: string
}

export function parseSingleTargetValue(value: string): number | null {
  const normalized = value.trim()
  if (!/^\d+$/.test(normalized)) return null
  const numericValue = Number(normalized)
  return Number.isFinite(numericValue) ? numericValue : null
}

export function formatPacingTarget(
  value: string,
  unit: PacingZone['unit'],
  lang: Lang = 'en'
): string {
  if (unit === 'w') return `${value}w`
  if (unit === 'bpm') return lang === 'es' ? `${value}ppm` : `${value}bpm`
  return lang === 'es' ? `${value}% FC` : `${value}% HR`
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
