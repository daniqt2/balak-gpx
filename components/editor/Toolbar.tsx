'use client'

import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'
import { ensureGpxFileSize, ensureGpxTrackPointLimit } from '@/lib/gpx/uploadGuard'
import { useT } from '@/lib/i18n'

interface ToolbarProps {
  fileName: string | null
  totalKm: number
  totalGain: number
  onUpload: (text: string, name: string) => void
  onExport: () => void
  onExportPacing: () => void
  onExportPacingStrip: () => void
  onExportPacingCue: () => void
  onRename: (name: string) => void
  onSendToGarmin: () => void
}

export default function Toolbar({
  fileName,
  totalKm,
  totalGain,
  onUpload,
  onExport,
  onExportPacing,
  onExportPacingStrip,
  onExportPacingCue,
  onRename,
  onSendToGarmin,
}: ToolbarProps) {
  const { t, lang, setLang } = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) nameInputRef.current?.select()
  }, [editing])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setExportOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function startEdit() {
    if (!fileName) return
    setDraft(fileName)
    setEditing(true)
  }

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed) onRename(trimmed)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') setEditing(false)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      ensureGpxFileSize(file, t)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t('upload.error_process'))
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        ensureGpxTrackPointLimit(text, t)
        onUpload(text, file.name.replace(/\.gpx$/i, ''))
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : t('upload.error_process'))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <header
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        flexShrink: 0,
      }}
    >
      <Link
        href="/"
        style={{ fontWeight: 900, fontSize: 16, letterSpacing: 1, color: '#fff', textDecoration: 'none' }}
      >
        BALAK
      </Link>
      <span style={{ fontWeight: 400, fontSize: 12, letterSpacing: 3, color: '#555' }}>
        GPX EDITOR
      </span>

      {fileName && (
        editing ? (
          <input
            ref={nameInputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            style={{
              fontSize: 12,
              color: '#fff',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #e94560',
              outline: 'none',
              marginLeft: 8,
              width: 200,
              padding: '1px 2px',
            }}
          />
        ) : (
          <span
            onClick={startEdit}
            title={t('toolbar.rename_hint')}
            style={{
              fontSize: 12,
              color: '#888',
              marginLeft: 8,
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'text',
              borderBottom: '1px solid transparent',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLSpanElement).style.borderBottomColor = '#444')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLSpanElement).style.borderBottomColor = 'transparent')}
          >
            {fileName}
          </span>
        )
      )}

      <div style={{ flex: 1 }} />

      {totalKm > 0 && (
        <span style={{ fontSize: 12, color: '#666', marginRight: 8 }}>
          {totalKm.toFixed(0)} km · +{totalGain} m
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      <button
        onClick={() => inputRef.current?.click()}
        style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          color: '#bbb',
          padding: '6px 14px',
          borderRadius: 4,
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        {t('toolbar.upload')}
      </button>

      <div ref={exportMenuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => fileName && setExportOpen((open) => !open)}
          disabled={!fileName}
          style={{
            background: fileName ? '#fff' : '#333',
            border: 'none',
            color: fileName ? '#111' : '#666',
            padding: '6px 14px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 700,
            cursor: fileName ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {t('toolbar.export')}
          <span style={{ fontSize: 10 }}>{exportOpen ? '▲' : '▼'}</span>
        </button>

        {exportOpen && fileName && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              minWidth: 190,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              padding: 6,
              zIndex: 20,
            }}
          >
            {[
              { label: t('toolbar.export_gpx'), action: onExport },
              { label: t('toolbar.export_image'), action: onExportPacing },
              { label: t('toolbar.export_strip'), action: onExportPacingStrip },
              { label: t('toolbar.export_cue'), action: onExportPacingCue },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.action()
                  setExportOpen(false)
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  textAlign: 'left',
                  fontSize: 12,
                  padding: '9px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#bfe23a'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#111'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onSendToGarmin}
        disabled={!fileName}
        title={t('toolbar.garmin_title')}
        style={{
          background: 'transparent',
          border: `1px solid ${fileName ? '#1c6ef2' : '#333'}`,
          color: fileName ? '#1c6ef2' : '#555',
          padding: '6px 14px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          cursor: fileName ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
        Garmin
      </button>

      <span style={{ width: 1, height: 20, background: 'var(--border)', marginLeft: 4 }} />

      {/* Language toggle */}
      {(['es', 'en'] as const).map((l, i) => (
        <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {i > 0 && <span style={{ color: '#333', fontSize: 10, margin: '0 2px' }}>|</span>}
          <button
            onClick={() => setLang(l)}
            style={{
              background: 'none',
              border: 'none',
              color: lang === l ? '#fff' : '#444',
              fontSize: 10,
              fontWeight: lang === l ? 700 : 400,
              cursor: 'pointer',
              padding: '0 2px',
              letterSpacing: 0.5,
            }}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}

      <span style={{ width: 1, height: 20, background: 'var(--border)' }} />

      {[
        {
          href: 'https://www.balakride.com/',
          title: 'balakride.com',
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          ),
        },
        {
          href: 'https://instagram.com/balak.ride',
          title: '@balak.ride',
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          ),
        },
        {
          href: 'mailto:balak.ride@gmail.com',
          title: 'balak.ride@gmail.com',
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          ),
        },
      ].map(({ href, title, icon }) => (
        <a
          key={href}
          href={href}
          target={href.startsWith('mailto') ? undefined : '_blank'}
          rel="noopener noreferrer"
          title={title}
          style={{ color: '#444', display: 'flex', alignItems: 'center', textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#aaa')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#444')}
        >
          {icon}
        </a>
      ))}
    </header>
  )
}
