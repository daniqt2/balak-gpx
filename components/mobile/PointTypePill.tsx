'use client'

import { PointType, POINT_CONFIG } from '@/types/points'
import { useT } from '@/lib/i18n'

interface PointTypePillProps {
  activeType: PointType
  onTypeChange: (t: PointType) => void
  visible: boolean
}

const TYPES = Object.keys(POINT_CONFIG) as PointType[]

export default function PointTypePill({ activeType, onTypeChange, visible }: PointTypePillProps) {
  const { t } = useT()
  const cfg = POINT_CONFIG[activeType]

  if (!visible) return null

  const next = () => {
    const idx = TYPES.indexOf(activeType)
    onTypeChange(TYPES[(idx + 1) % TYPES.length])
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: 100,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 15,
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      background: 'rgba(17,17,17,0.92)',
      border: `1px solid ${cfg.color}`,
      borderRadius: 24,
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    }}>
      {TYPES.map((type) => {
        const c = POINT_CONFIG[type]
        const active = type === activeType
        return (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            style={{
              background: active ? c.color + '22' : 'transparent',
              border: 'none',
              padding: active ? '8px 14px' : '8px 10px',
              cursor: 'pointer',
              fontSize: active ? 13 : 16,
              color: active ? c.color : '#444',
              fontWeight: active ? 700 : 400,
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {active ? <>{c.emoji} {t(`points.${type}`)}</> : c.emoji}
          </button>
        )
      })}
    </div>
  )
}
