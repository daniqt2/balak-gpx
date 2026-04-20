'use client'

import { useEffect, useState } from 'react'
import {
  formatPacingTarget,
  PacingZone,
  ZONE_COLORS,
  parseSingleTargetValue,
} from '@/types/pacing'
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
type ZoneOption = ZoneLabel | 'custom'
type PacingMode = 'w' | 'bpm'
type BpmMode = 'bpm' | '%'

function getZoneByLabel(label: ZoneOption | '') {
  return FTP_ZONE_DEFAULTS.find((zone) => zone.label === label) ?? null
}

interface PacingPanelProps {
  zones: PacingZone[]
  totalKm: number
  ftp: number
  onFtpChange: (ftp: number) => void
  onAdd: (zone: PacingZone) => void
  onDelete: (id: string) => void
}

export default function PacingPanel({
  zones,
  totalKm,
  ftp,
  onFtpChange,
  onAdd,
  onDelete,
}: PacingPanelProps) {
  const { t, lang } = useT()
  const [kmStart, setKmStart] = useState(zones[0] ? String(zones[zones.length - 1].kmEnd) : '0')
  const [kmEnd, setKmEnd] = useState('')
  const [zoneLabel, setZoneLabel] = useState<ZoneOption | ''>('')
  const [customLabel, setCustomLabel] = useState('')
  const [mode, setMode] = useState<PacingMode>('w')
  const [bpmMode, setBpmMode] = useState<BpmMode>('bpm')
  const [targetFrom, setTargetFrom] = useState('')
  const [targetTo, setTargetTo] = useState('')

  const kmStartN = parseFloat(kmStart)
  const kmEndN = parseFloat(kmEnd)
  const selectedZone = getZoneByLabel(zoneLabel)
  const suggestedWatts = ftp > 0 && selectedZone ? String(Math.round(ftp * selectedZone.factor)) : ''
  const targetFromN = parseFloat(targetFrom)
  const targetToN = parseFloat(targetTo)
  const hasTargetFrom = targetFrom.trim() !== '' && !isNaN(targetFromN)
  const hasTargetTo = targetTo.trim() !== '' && !isNaN(targetToN)
  const targetValue = hasTargetTo ? `${targetFrom.trim()}-${targetTo.trim()}` : targetFrom.trim()
  const targetUnit = mode === 'w' ? 'w' : bpmMode
  const finalLabel = zoneLabel === 'custom' ? customLabel.trim() : zoneLabel
  const valid =
    finalLabel !== '' &&
    !isNaN(kmStartN) &&
    !isNaN(kmEndN) &&
    hasTargetFrom &&
    (!hasTargetTo || targetToN >= targetFromN) &&
    kmEndN > kmStartN &&
    kmStartN >= 0 &&
    kmEndN <= totalKm + 0.5

  useEffect(() => {
    if (mode === 'w' && targetFrom.trim() === '') {
      setTargetFrom(suggestedWatts)
    }
  }, [mode, suggestedWatts, targetFrom])

  useEffect(() => {
    if (zones.length === 0) {
      setKmStart((current) => (current.trim() === '' ? '0' : current))
      return
    }
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
      value: targetValue,
      unit: targetUnit,
      label: finalLabel,
      color,
    })
    setKmStart(String(kmEndN))
    setKmEnd('')
    setTargetFrom('')
    setTargetTo('')
    setZoneLabel('')
    setCustomLabel('')
    setMode('w')
    setBpmMode('bpm')
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

  const targetLabel =
    mode === 'w'
      ? t('pacing.watts')
      : bpmMode === 'bpm'
        ? t('pacing.hr_value')
        : t('pacing.hr_percent')

  const targetToPlaceholder =
    mode === 'w'
      ? t('pacing.watts_to_optional')
      : bpmMode === 'bpm'
        ? t('pacing.hr_value_to_optional')
        : t('pacing.hr_percent_to_optional')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                  km {z.kmStart}–{z.kmEnd} · {formatPacingTarget(z.value, z.unit, lang)}
                  {z.unit === 'w' && ftp > 0 && parseSingleTargetValue(z.value) != null && (
                    <span style={{ color: z.color, marginLeft: 4 }}>
                      {Math.round((parseSingleTargetValue(z.value)! / ftp) * 100)}%
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            paddingBottom: 10,
            marginBottom: 8,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {(['w', 'bpm'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setMode(option)}
                type="button"
                style={{
                  background: mode === option ? '#fff' : 'var(--surface2)',
                  color: mode === option ? '#111' : '#888',
                  border: `1px solid ${mode === option ? '#fff' : 'var(--border)'}`,
                  borderRadius: 6,
                  padding: '6px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {option === 'w' ? t('pacing.mode_watts') : t('pacing.mode_hr')}
              </button>
            ))}
          </div>
          {mode === 'w' && (
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
          )}
          {mode === 'bpm' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 4,
                padding: '0 10px',
              }}
            >
              {([
                { value: 'bpm', label: t('pacing.hr_by_value') },
                { value: '%', label: t('pacing.hr_by_percent') },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBpmMode(option.value)}
                  type="button"
                  style={{
                    background: bpmMode === option.value ? 'rgba(255,255,255,0.08)' : 'var(--surface2)',
                    color: bpmMode === option.value ? '#fff' : '#888',
                    border: `1px solid ${bpmMode === option.value ? '#555' : 'var(--border)'}`,
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 0.4,
                    cursor: 'pointer',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
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
            onChange={(e) => setZoneLabel(e.target.value as ZoneOption)}
            style={{ ...inputStyle, color: zoneLabel === '' ? '#666' : '#fff' }}
          >
            <option value="">{t('pacing.zone_default')}</option>
            {FTP_ZONE_DEFAULTS.map((zone) => (
              <option key={zone.label} value={zone.label}>
                {zone.label}
              </option>
            ))}
            <option value="custom">{t('pacing.zone_custom')}</option>
          </select>
        </div>
        {zoneLabel === 'custom' && (
          <div>
            <div style={{ color: '#555', fontSize: 9, marginBottom: 3 }}>{t('pacing.custom_name')}</div>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder={t('pacing.custom_name_placeholder')}
              style={inputStyle}
            />
          </div>
        )}
        <div>
          <div style={{ color: '#555', fontSize: 9, marginBottom: 3 }}>{targetLabel}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 16px 1fr', gap: 4, alignItems: 'center' }}>
            <input
              type="number"
              inputMode="numeric"
              value={targetFrom}
              onChange={(e) => setTargetFrom(e.target.value)}
              placeholder={mode === 'w' ? '200' : bpmMode === 'bpm' ? '155' : '85'}
              style={inputStyle}
            />
            <div style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>-</div>
            <input
              type="number"
              inputMode="numeric"
              value={targetTo}
              onChange={(e) => setTargetTo(e.target.value)}
              placeholder={targetToPlaceholder}
              style={inputStyle}
            />
          </div>
          {mode === 'w' && ftp > 0 && parseSingleTargetValue(targetValue) != null && (
            <div style={{ color: '#666', fontSize: 10, marginTop: 4 }}>
              {Math.round((parseSingleTargetValue(targetValue)! / ftp) * 100)}% FTP
            </div>
          )}
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
    </div>
  )
}
