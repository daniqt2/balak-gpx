'use client'

import { useRef } from 'react'
import { useT } from '@/lib/i18n'

interface MobileToolbarProps {
  fileName: string | null
  onUpload: (text: string, name: string) => void
  onExport: () => void
  onSendToGarmin: () => void
}

export default function MobileToolbar({ fileName, onUpload, onExport, onSendToGarmin }: MobileToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { lang, setLang } = useT()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onUpload(ev.target?.result as string, file.name.replace(/\.gpx$/i, ''))
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      height: 48,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 8,
      flexShrink: 0,
    }}>
      <a href="/" style={{ fontWeight: 900, fontSize: 15, letterSpacing: 1, color: '#fff', textDecoration: 'none' }}>
        BALAK
      </a>

      {fileName && (
        <span style={{ fontSize: 11, color: '#666', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fileName}
        </span>
      )}
      {!fileName && <div style={{ flex: 1 }} />}

      {/* ES | EN */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {(['es', 'en'] as const).map((l, i) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && <span style={{ color: '#333', fontSize: 10, margin: '0 1px' }}>|</span>}
            <button onClick={() => setLang(l)} style={{
              background: 'none', border: 'none',
              color: lang === l ? '#fff' : '#444',
              fontSize: 10, fontWeight: lang === l ? 700 : 400,
              cursor: 'pointer', padding: '0 2px',
            }}>{l.toUpperCase()}</button>
          </span>
        ))}
      </div>

      <input ref={inputRef} type="file" accept=".gpx" style={{ display: 'none' }} onChange={handleFile} />

      {/* Upload */}
      <button onClick={() => inputRef.current?.click()} style={iconBtn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
      </button>

      {/* Export */}
      <button onClick={onExport} disabled={!fileName} style={{ ...iconBtn, opacity: fileName ? 1 : 0.3 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>

      {/* Garmin */}
      <button onClick={onSendToGarmin} disabled={!fileName} style={{ ...iconBtn, color: fileName ? '#1c6ef2' : '#555', opacity: fileName ? 1 : 0.3 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
      </button>
    </header>
  )
}

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#aaa',
  cursor: 'pointer',
  padding: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
