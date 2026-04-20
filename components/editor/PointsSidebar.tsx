'use client'

import { useState } from 'react'
import { RouteMarker, PointType, POINT_CONFIG } from '@/types/points'
import { useT } from '@/lib/i18n'
import { PacingZone } from '@/types/pacing'
import PointCard from './PointCard'
import PacingPanel from './PacingPanel'

interface PointsSidebarProps {
  markers: RouteMarker[]
  activeType: PointType
  onTypeChange: (type: PointType) => void
  onDelete: (id: string) => void
  onEdit: (id: string, label: string) => void
  hasRoute: boolean
  totalKm: number
  onAddByKm: () => void
  onAddByTime: () => void
  pacingZones: PacingZone[]
  ftp: number
  onFtpChange: (ftp: number) => void
  onAddZone: (zone: PacingZone) => void
  onDeleteZone: (id: string) => void
}

export default function PointsSidebar({
  markers,
  activeType,
  onTypeChange,
  onDelete,
  onEdit,
  hasRoute,
  totalKm,
  onAddByKm,
  onAddByTime,
  pacingZones,
  ftp,
  onFtpChange,
  onAddZone,
  onDeleteZone,
}: PointsSidebarProps) {
  const { t } = useT()
  const [tab, setTab] = useState<'puntos' | 'pacing'>('puntos')
  const sorted = [...markers].sort((a, b) => a.distanceFromStart - b.distanceFromStart)

  const tabBtn = (t: 'puntos' | 'pacing', label: string) => (
    <button
      onClick={() => setTab(t)}
      style={{
        flex: 1,
        padding: '8px 0',
        background: 'none',
        border: 'none',
        borderBottom: tab === t ? '2px solid #e94560' : '2px solid transparent',
        color: tab === t ? '#fff' : '#555',
        fontSize: 11,
        fontWeight: tab === t ? 700 : 400,
        letterSpacing: 1,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )

  return (
    <aside
      style={{
        width: 240,
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {tabBtn('puntos', t('sidebar.tab_points'))}
        {tabBtn('pacing', t('sidebar.tab_pacing'))}
      </div>

      {tab === 'puntos' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {!hasRoute && (
              <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', marginTop: 24 }}>
                {t('sidebar.no_route')}
              </p>
            )}
            {hasRoute && sorted.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', marginTop: 24 }}>
                {t('sidebar.click_hint')}
              </p>
            )}
            {sorted.map((m) => (
              <PointCard key={m.id} marker={m} onDelete={onDelete} onEdit={onEdit} />
            ))}
          </div>

          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 6, letterSpacing: 1 }}>
              {t('sidebar.point_type')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {(Object.keys(POINT_CONFIG) as PointType[]).map((type) => {
                const cfg = POINT_CONFIG[type]
                const active = type === activeType
                return (
                  <button
                    key={type}
                    onClick={() => onTypeChange(type)}
                    style={{
                      background: active ? cfg.color + '22' : 'var(--surface2)',
                      border: active ? `1px solid ${cfg.color}` : '1px solid var(--border)',
                      borderRadius: 4,
                      padding: '5px 6px',
                      color: active ? cfg.color : '#aaa',
                      fontSize: 10,
                      textAlign: 'center',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {cfg.emoji} {t(`points.${type}`)}
                  </button>
                )
              })}
            </div>
            {hasRoute && (
              <>
                <button
                  onClick={onAddByKm}
                  style={{
                    marginTop: 8,
                    width: '100%',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    color: '#aaa',
                    borderRadius: 4,
                    padding: '7px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {t('sidebar.add_by_km')}
                </button>
                <button
                  onClick={onAddByTime}
                  style={{
                    marginTop: 6,
                    width: '100%',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    color: '#aaa',
                    borderRadius: 4,
                    padding: '7px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {t('sidebar.add_by_time')}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {tab === 'pacing' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
          {!hasRoute ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', marginTop: 24 }}>
              {t('sidebar.no_route')}
            </p>
          ) : (
            <PacingPanel
              zones={pacingZones}
              totalKm={totalKm}
              ftp={ftp}
              onFtpChange={onFtpChange}
              onAdd={onAddZone}
              onDelete={onDeleteZone}
            />
          )}
        </div>
      )}
    </aside>
  )
}
