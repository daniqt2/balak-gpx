'use client'

import { useRef } from 'react'

interface ToolbarProps {
  fileName: string | null
  totalKm: number
  totalGain: number
  onUpload: (text: string, name: string) => void
  onExport: () => void
}

export default function Toolbar({
  fileName,
  totalKm,
  totalGain,
  onUpload,
  onExport,
}: ToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      onUpload(text, file.name.replace(/\.gpx$/i, ''))
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
      <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: 1, color: '#fff' }}>
        BALAK
      </span>
      <span style={{ fontWeight: 400, fontSize: 12, letterSpacing: 3, color: '#555' }}>
        GPX EDITOR
      </span>

      {fileName && (
        <span
          style={{
            fontSize: 12,
            color: '#888',
            marginLeft: 8,
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {fileName}
        </span>
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
        ↑ Subir GPX
      </button>

      <button
        onClick={onExport}
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
        }}
      >
        ↓ Exportar
      </button>
    </header>
  )
}
