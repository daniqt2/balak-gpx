'use client'

import { useEffect, useState } from 'react'
import { PacingZone, ZONE_COLORS } from '@/types/pacing'
import { useT } from '@/lib/i18n'
import { generateId } from '@/lib/utils/ids'

const FTP_ZONE_DEFAULTS = [
  { label: 'Z1', factor: 0.55 },
  { label: 'Z2', factor: 0.66 },
  { label: 'Z3', factor: 0.83 },
  { label: 'Z4', factor: 0.98 },
  { label: 'Z5', factor: 1.13 },
  { label: 'Z6', factor: 1.35 },
  { label: 'Z7', factor: 1.5 },
] as const

type ZoneLabel = (typeof FTP_ZONE_DEFAULTS)[number]['label']

function getZoneByLabel(label: ZoneLabel | '') {
  return FTP_ZONE_DEFAULTS.find((zone) => zone.label === label) ?? null
}

interface PacingPanelProps {
  zones: PacingZone[]
  totalKm: number
  ftp: number
  onFtpChange: (ftp: number) => void
  onAdd: (zone: PacingZone) => void
  onDelete: (id: string) => void
  onExport: () => void
  onExportStrip: () => void
  onExportCue: () => void
}

export default function PacingPanel({
  zones,
  totalKm,
  ftp,
  onFtpChange,
  onAdd,
  onDelete,
  onExport,
  onExportStrip,
  onExportCue,
}: PacingPanelProps) {
  const { t } = useT()
  const [kmStart, setKmStart] = useState(zones[0] ? String(zones[zones.length - 1].kmEnd) : '')
  const [kmEnd, setKmEnd] = useState('')
  const [zoneLabel, setZoneLabel] = useState<ZoneLabel | ''>('')
  const [watts, setWatts] = useState('')

  const kmStartN = parseFloat(kmStart)
  const kmEndN = parseFloat(kmEnd)
  const wattsN = parseFloat(watts)
  const selectedZone = getZoneByLabel(zoneLabel)
  const suggestedWatts = ftp > 0 && selectedZone ? String(Math.round(ftp * selectedZone.factor)) : ''
  const valid =
    zoneLabel !== '' &&
    !isNaN(kmStartN) &&
    !isNaN(kmEndN) &&
    !isNaN(wattsN) &&
    kmEndN > kmStartN &&
    kmStartN >= 0 &&
    kmEndN <= totalKm + 0.5

  useEffect(() => {
    if (watts.trim() === '') {
      setWatts(suggestedWatts)
    }
  }, [suggestedWatts, watts])

  useEffect(() => {
    if (zones.length === 0) return
    const lastZone = zones[zones.length - 1]
    setKmStart((current) => (current.trim() === '' ? String(lastZone.kmEnd) : current))
  }, [zones])

  function handleAdd() {
    if (!valid) return
    const color = ZONE_COLORS[zones.length % ZONE_COLORS.length]
    onAdd({
      id: generateId(),
      kmStart: kmStartN,
      kmEnd: kmEndN,
      watts: wattsN,
      label: zoneLabel,
      color,
    })
    setKmStart(String(kmEndN))
    setKmEnd('')
    setWatts('')
    setZoneLabel('')
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    color: '#fff',
    padding: '5px 7px',
    borderRadius: 4,
    fontSize: 11,
    width: '100%',
    outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* FTP input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1, whiteSpace: 'nowrap' }}>
          FTP
        </span>
        <input
          type="number"
          value={ftp || ''}
          onChange={(e) => onFtpChange(parseInt(e.target.value) || 0)}
          placeholder="250"
          style={{ ...inputStyle, width: 60 }}
        />
        <span style={{ color: '#555', fontSize: 10 }}>w</span>
      </div>

      {/* Zones list */}
      {zones.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {zones.map((z) => (
            <div
              key={z.id}
              style={{
                background: 'var(--surface2)',
                borderRadius: 5,
                padding: '6px 8px',
                borderLeft: `3px solid ${z.color}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{z.label}</div>
                <div style={{ color: '#666', fontSize: 10 }}>
                  km {z.kmStart}–{z.kmEnd} · {z.watts}w
                  {ftp > 0 && (
                    <span style={{ color: z.color, marginLeft: 4 }}>
                      {Math.round((z.watts / ftp) * 100)}%
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDelete(z.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#555',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '0 4px',
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1 }}>
          {t('pacing.new_zone')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <div>
            <div style={{ color: '#555', fontSize: 9, marginBottom: 3 }}>{t('pacing.km_start')}</div>
            <input
              type="number"
              value={kmStart}
              onChange={(e) => setKmStart(e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
          </div>
          <div>
            <div style={{ color: '#555', fontSize: 9, marginBottom: 3 }}>{t('pacing.km_end')}</div>
            <input
              type="number"
              value={kmEnd}
              onChange={(e) => setKmEnd(e.target.value)}
              placeholder={totalKm.toFixed(0)}
              style={inputStyle}
            />
          </div>
        </div>
        <div>
            <div style={{ color: '#555', fontSize: 9, marginBottom: 3 }}>{t('pacing.name_optional')}</div>
          <select
            value={zoneLabel}
            onChange={(e) => setZoneLabel(e.target.value as ZoneLabel)}
            style={inputStyle}
          >
            <option value="">{t('pacing.zone_default')}</option>
            {FTP_ZONE_DEFAULTS.map((zone) => (
              <option key={zone.label} value={zone.label}>
                {zone.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ color: '#555', fontSize: 9, marginBottom: 3 }}>{t('pacing.watts')}</div>
          <input
            type="number"
            value={watts}
            onChange={(e) => setWatts(e.target.value)}
            placeholder="200"
            style={inputStyle}
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!valid}
          style={{
            background: valid ? 'var(--surface2)' : '#1a1a1a',
            border: `1px solid ${valid ? 'var(--border)' : '#222'}`,
            color: valid ? '#fff' : '#444',
            borderRadius: 4,
            padding: '6px',
            fontSize: 11,
            cursor: valid ? 'pointer' : 'default',
          }}
        >
          {t('pacing.add_zone')}
        </button>
      </div>

      {zones.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={onExport}
            style={{
              background: '#fff',
              border: 'none',
              color: '#111',
              borderRadius: 4,
              padding: '7px',
              fontWeight: 700,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            {t('pacing.export_image')}
          </button>
          <button
            onClick={onExportStrip}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: '#fff',
              borderRadius: 4,
              padding: '7px',
              fontWeight: 700,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            {t('pacing.export_strip')}
          </button>
          <button
            onClick={onExportCue}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: '#fff',
              borderRadius: 4,
              padding: '7px',
              fontWeight: 700,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            {t('pacing.export_cue')}
          </button>
        </div>
      )}
    </div>
  )
}
