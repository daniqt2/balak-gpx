'use client'

import { useState } from 'react'
import { RouteMarker } from '@/types/points'
import { POINT_CONFIG } from '@/types/points'
import { useT } from '@/lib/i18n'

interface PointCardProps {
  marker: RouteMarker
  onDelete: (id: string) => void
  onEdit: (id: string, label: string) => void
}

export default function PointCard({ marker, onDelete, onEdit }: PointCardProps) {
  const { t } = useT()
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(marker.label)
  const cfg = POINT_CONFIG[marker.type]

  function save() {
    onEdit(marker.id, label.trim() || cfg.label)
    setEditing(false)
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 6,
        padding: '8px 10px',
        marginBottom: 6,
        borderLeft: `3px solid ${cfg.color}`,
      }}
    >
      {editing ? (
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            style={{
              flex: 1,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: '#fff',
              padding: '3px 6px',
              borderRadius: 3,
              fontSize: 11,
            }}
          />
          <button
            onClick={save}
            style={{
              background: '#fff',
              border: 'none',
              color: '#111',
              padding: '3px 8px',
              borderRadius: 3,
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            ✓
          </button>
        </div>
      ) : (
        <>
          <div style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>
            {cfg.emoji} {marker.label}
          </div>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: 10,
              marginTop: 2,
              marginBottom: 6,
            }}
          >
            km {marker.distanceFromStart.toFixed(1)}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setEditing(true)}
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: '#aaa',
                padding: '3px 8px',
                borderRadius: 3,
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              {t('point.edit')}
            </button>
            <button
              onClick={() => onDelete(marker.id)}
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: '#ef4444',
                padding: '3px 8px',
                borderRadius: 3,
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  )
}
