'use client'

import { useMemo, useState } from 'react'
import { PointType, POINT_CONFIG } from '@/types/points'
import { useT } from '@/lib/i18n'

interface AddByTimeModalProps {
  totalKm: number
  activeType: PointType
  onConfirm: (speedKmh: number, everyMinutes: number, type: PointType, label: string) => void
  onClose: () => void
}

export default function AddByTimeModal({
  totalKm,
  activeType,
  onConfirm,
  onClose,
}: AddByTimeModalProps) {
  const { t } = useT()
  const [speedKmh, setSpeedKmh] = useState('')
  const [everyMinutes, setEveryMinutes] = useState('')
  const [type, setType] = useState<PointType>(activeType)
  const [label, setLabel] = useState('')

  const cfg = POINT_CONFIG[type]
  const speedNum = parseFloat(speedKmh)
  const everyNum = parseFloat(everyMinutes)
  const intervalKm = useMemo(() => {
    if (isNaN(speedNum) || isNaN(everyNum) || speedNum <= 0 || everyNum <= 0) return 0
    return (speedNum * everyNum) / 60
  }, [speedNum, everyNum])
  const generatedCount = intervalKm > 0 ? Math.floor(totalKm / intervalKm) : 0
  const valid = intervalKm > 0 && generatedCount >= 1

  function handleConfirm() {
    if (!valid) return
    onConfirm(speedNum, everyNum, type, label.trim() || cfg.label)
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    color: '#fff',
    padding: '8px 10px',
    borderRadius: 5,
    fontSize: 13,
    outline: 'none',
    width: '100%',
    minWidth: 0,
    height: 38,
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: 24,
          width: 320,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
            {t('modal_time.title')}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>
              {t('modal_time.speed_label')}
            </label>
            <input
              autoFocus
              type="number"
              min={1}
              step={0.1}
              value={speedKmh}
              onChange={(e) => setSpeedKmh(e.target.value)}
              placeholder={t('modal_time.speed_placeholder')}
              style={{
                ...inputStyle,
                borderColor: speedKmh === '' || speedNum > 0 ? 'var(--border)' : '#ef4444',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>
              {t('modal_time.every_label')}
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={everyMinutes}
              onChange={(e) => setEveryMinutes(e.target.value)}
              placeholder={t('modal_time.every_placeholder')}
              style={{
                ...inputStyle,
                borderColor: everyMinutes === '' || everyNum > 0 ? 'var(--border)' : '#ef4444',
              }}
            />
          </div>
        </div>

        <div
          style={{
            padding: '8px 10px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            color: valid ? '#9ca3af' : '#666',
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          {valid
            ? t('modal_time.summary', {
                interval: intervalKm.toFixed(1),
                count: String(generatedCount),
              })
            : t('modal_time.summary_invalid', { max: totalKm.toFixed(1) })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>
            {t('modal.type_label')}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {(Object.keys(POINT_CONFIG) as PointType[]).map((pt) => {
              const c = POINT_CONFIG[pt]
              const active = pt === type
              return (
                <button
                  key={pt}
                  onClick={() => setType(pt)}
                  style={{
                    background: active ? c.color + '22' : 'var(--surface2)',
                    border: active ? `1px solid ${c.color}` : '1px solid var(--border)',
                    borderRadius: 4,
                    padding: '5px 6px',
                    color: active ? c.color : '#aaa',
                    fontSize: 10,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {c.emoji} {t(`points.${pt}`)}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>
            {t('modal.name_optional')}
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            placeholder={cfg.label}
            style={inputStyle}
          />
        </div>

        <button
          onClick={handleConfirm}
          disabled={!valid}
          style={{
            background: valid ? '#fff' : '#333',
            color: valid ? '#111' : '#666',
            border: 'none',
            borderRadius: 5,
            padding: '10px',
            fontWeight: 700,
            fontSize: 13,
            cursor: valid ? 'pointer' : 'default',
          }}
        >
          {t('modal_time.add_button')}
        </button>
      </div>
    </div>
  )
}
