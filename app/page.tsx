'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { parseGpx, routeToGeoJSON } from '@/lib/gpx/parseGpx'

interface GpxEntry {
  file: string
  name: string
}

export default function UploadPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [routes, setRoutes] = useState<GpxEntry[]>([])
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null)

  useEffect(() => {
    fetch('/gpx/index.json')
      .then((r) => r.json())
      .then(setRoutes)
      .catch(() => {})
  }, [])

  function storeAndNavigate(text: string, name: string) {
    const route = parseGpx(text)
    const geoJSON = routeToGeoJSON(route)
    sessionStorage.setItem(
      'gpx-editor-data',
      JSON.stringify({ route, routeGeoJSON: geoJSON, markers: [], fileName: name })
    )
    router.push('/editor')
  }

  function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setError('Solo se admiten archivos .gpx')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        storeAndNavigate(e.target?.result as string, file.name.replace(/\.gpx$/i, ''))
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al procesar el archivo')
      }
    }
    reader.readAsText(file)
  }

  async function loadPreset(entry: GpxEntry) {
    setLoadingRoute(entry.file)
    setError(null)
    try {
      const res = await fetch(`/gpx/${entry.file}`)
      if (!res.ok) throw new Error('No se pudo cargar el archivo')
      const text = await res.text()
      storeAndNavigate(text, entry.name)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar la ruta')
      setLoadingRoute(null)
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '40px 24px',
      }}
    >
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 48,
            fontWeight: 900,
            letterSpacing: 2,
            color: '#fff',
            margin: 0,
          }}
        >
          BALAK{' '}
          <span style={{ fontWeight: 300, color: '#555' }}>GPX EDITOR</span>
        </h1>
        <p style={{ color: '#666', marginTop: 12, fontSize: 14 }}>
          Sube una ruta, añade puntos y exporta tu GPX
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          width: '100%',
          maxWidth: 420,
          border: `2px dashed ${dragging ? '#fff' : 'var(--border)'}`,
          borderRadius: 12,
          padding: '40px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(255,255,255,0.03)' : 'transparent',
          transition: 'all 0.15s',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>↑</div>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
          Arrastra tu archivo GPX aquí
        </div>
        <div style={{ color: '#666', fontSize: 13 }}>o haz clic para seleccionar</div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      {error && (
        <div
          style={{
            marginTop: 16,
            color: '#ef4444',
            fontSize: 13,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            padding: '8px 16px',
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}

      {/* Preset routes */}
      {routes.length > 0 && (
        <div style={{ width: '100%', maxWidth: 600, marginTop: 48 }}>
          <div
            style={{
              color: '#555',
              fontSize: 11,
              letterSpacing: 2,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            RUTAS DISPONIBLES
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: 10,
            }}
          >
            {routes.map((r) => (
              <button
                key={r.file}
                onClick={() => loadPreset(r)}
                disabled={loadingRoute === r.file}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '14px 16px',
                  cursor: loadingRoute === r.file ? 'default' : 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (loadingRoute !== r.file) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#e94560'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(233,69,96,0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 6 }}>🗺️</div>
                <div
                  style={{
                    color: loadingRoute === r.file ? '#666' : '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  {loadingRoute === r.file ? 'Cargando…' : r.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
