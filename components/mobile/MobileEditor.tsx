'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { EditorState } from '@/types/project'
import { PointType } from '@/types/points'
import { PacingZone } from '@/types/pacing'
import { useT } from '@/lib/i18n'
import MobileToolbar from './MobileToolbar'
import PointTypePill from './PointTypePill'
import PointCard from '@/components/editor/PointCard'
import PacingPanel from '@/components/editor/PacingPanel'
import ElevationStrip from '@/components/editor/ElevationStrip'
import AddByKmModal from '@/components/editor/AddByKmModal'

const RouteMap = dynamic(() => import('@/components/map/RouteMap'), { ssr: false })

type Tab = 'puntos' | 'pacing'

interface MobileEditorProps {
  state: EditorState
  activeType: PointType
  pacingZones: PacingZone[]
  ftp: number
  totalKm: number
  totalGain: number
  onUpload: (text: string, name: string) => void
  onExport: () => void
  onSendToGarmin: () => void
  onMapClick: (lng: number, lat: number, dist: number) => void
  onDelete: (id: string) => void
  onEdit: (id: string, label: string) => void
  onTypeChange: (t: PointType) => void
  onFtpChange: (v: number) => void
  onAddZone: (z: PacingZone) => void
  onDeleteZone: (id: string) => void
  onExportPacing: () => void
  onAddByKm: (km: number, type: PointType, label: string) => void
}

export default function MobileEditor({
  state, activeType, pacingZones, ftp, totalKm,
  onUpload, onExport, onSendToGarmin, onMapClick,
  onDelete, onEdit, onTypeChange, onFtpChange,
  onAddZone, onDeleteZone, onExportPacing, onAddByKm,
}: MobileEditorProps) {
  const { t } = useT()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('puntos')
  const [hoverPoint, setHoverPoint] = useState<{ lat: number; lon: number } | null>(null)
  const [showKmModal, setShowKmModal] = useState(false)

  const sorted = [...state.markers].sort((a, b) => a.distanceFromStart - b.distanceFromStart)
  const hasEle = !!state.route?.some(p => p.ele != null)

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, background: 'none', border: 'none',
    borderBottom: active ? '2px solid #e94560' : '2px solid transparent',
    color: active ? '#fff' : '#555',
    fontSize: 11, fontWeight: active ? 700 : 400,
    letterSpacing: 1, padding: '10px 0', cursor: 'pointer',
  })

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <MobileToolbar
        fileName={state.fileName}
        onUpload={onUpload}
        onExport={onExport}
        onSendToGarmin={onSendToGarmin}
      />

      {/* Map area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          <RouteMap
            routeGeoJSON={state.routeGeoJSON}
            markers={state.markers}
            onMapClick={onMapClick}
            hoverPoint={hoverPoint}
            pacingZones={pacingZones}
            onMapReady={() => {}}
          />
        </div>

        {/* Floating point type pill */}
        <PointTypePill
          activeType={activeType}
          onTypeChange={onTypeChange}
          visible={!!state.routeGeoJSON}
        />

        {/* Drawer toggle FAB */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            width: 40, height: 40, borderRadius: 8,
            background: 'rgba(17,17,17,0.88)',
            border: '1px solid var(--border)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Backdrop */}
        {drawerOpen && (
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: 'absolute', inset: 0, zIndex: 19, background: 'rgba(0,0,0,0.4)' }}
          />
        )}

        {/* Side drawer */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: '82%', maxWidth: 320,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          zIndex: 20,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.32,0.72,0,1)',
        }}>
          {/* Drawer header */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <button style={tabStyle(tab === 'puntos')} onClick={() => setTab('puntos')}>
              {t('sidebar.tab_points')}
            </button>
            <button style={tabStyle(tab === 'pacing')} onClick={() => setTab('pacing')}>
              {t('sidebar.tab_pacing')}
            </button>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{ background: 'none', border: 'none', color: '#555', fontSize: 18, cursor: 'pointer', padding: '0 14px', flexShrink: 0 }}
            >
              ✕
            </button>
          </div>

          {/* Drawer content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {tab === 'puntos' && (
              <>
                {!state.routeGeoJSON && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
                    {t('sidebar.no_route')}
                  </p>
                )}
                {state.routeGeoJSON && sorted.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
                    {t('sidebar.click_hint')}
                  </p>
                )}
                {sorted.map(m => (
                  <PointCard key={m.id} marker={m} onDelete={onDelete} onEdit={onEdit} />
                ))}
                {state.routeGeoJSON && (
                  <button
                    onClick={() => { setShowKmModal(true); setDrawerOpen(false) }}
                    style={{
                      marginTop: 8, width: '100%',
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      color: '#aaa', borderRadius: 4, padding: '9px', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    {t('sidebar.add_by_km')}
                  </button>
                )}
              </>
            )}

            {tab === 'pacing' && (
              !state.routeGeoJSON
                ? <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 24 }}>{t('sidebar.no_route')}</p>
                : <PacingPanel
                    zones={pacingZones} totalKm={totalKm} ftp={ftp}
                    onFtpChange={onFtpChange} onAdd={onAddZone}
                    onDelete={onDeleteZone} onExport={onExportPacing}
                  />
            )}
          </div>
        </div>
      </div>

      {/* Elevation strip — always visible at bottom */}
      {hasEle && state.route && (
        <ElevationStrip
          route={state.route}
          totalKm={totalKm}
          onHover={(pt) => setHoverPoint(pt ? { lat: pt.lat, lon: pt.lon } : null)}
          pacingZones={pacingZones}
          markers={state.markers}
        />
      )}

      {showKmModal && (
        <AddByKmModal
          totalKm={totalKm}
          activeType={activeType}
          onConfirm={(km, type, label) => { onAddByKm(km, type, label); setShowKmModal(false) }}
          onClose={() => setShowKmModal(false)}
        />
      )}
    </div>
  )
}
