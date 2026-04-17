'use client'

import { useState } from 'react'
import { PointType, POINT_CONFIG } from '@/types/points'
import { useT } from '@/lib/i18n'

interface AddByKmModalProps {
  totalKm: number
  activeType: PointType
  onConfirm: (km: number, type: PointType, label: string) => void
  onClose: () => void
}

export default function AddByKmModal({
  totalKm,
  activeType,
  onConfirm,
  onClose,
}: AddByKmModalProps) {
  const [km, setKm] = useState('')
  const [type, setType] = useState<PointType>(activeType)
  const [label, setLabel] = useState('')

  const { t } = useT()
  const cfg = POINT_CONFIG[type]
  const kmNum = parseFloat(km)
  const valid = !isNaN(kmNum) && kmNum >= 0 && kmNum <= totalKm

  function handleConfirm() {
    if (!valid) return
    onConfirm(kmNum, type, label.trim() || cfg.label)
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
            {t('modal.title')}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>
            {t('modal.km_label', { max: totalKm.toFixed(1) })}
          </label>
          <input
            autoFocus
            type="number"
            min={0}
            max={totalKm}
            step={0.1}
            value={km}
            onChange={(e) => setKm(e.target.value)}
            placeholder={t('modal.km_placeholder', { mid: (totalKm / 2).toFixed(0) })}
            style={{
              background: 'var(--surface2)',
              border: `1px solid ${valid || km === '' ? 'var(--border)' : '#ef4444'}`,
              color: '#fff',
              padding: '8px 10px',
              borderRadius: 5,
              fontSize: 14,
              outline: 'none',
            }}
          />
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
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: '#fff',
              padding: '8px 10px',
              borderRadius: 5,
              fontSize: 13,
              outline: 'none',
            }}
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
          {t('modal.add_button')}
        </button>
      </div>
    </div>
  )
}
