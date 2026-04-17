'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { EditorState } from '@/types/project'
import { PointType, RouteMarker, POINT_CONFIG } from '@/types/points'
import { PacingZone } from '@/types/pacing'
import { parseGpx, routeToGeoJSON } from '@/lib/gpx/parseGpx'
import { totalRouteDistance, totalElevationGain } from '@/lib/geo/distanceOnRoute'
import { pointAtKm } from '@/lib/geo/pointAtKm'
import { exportGpx } from '@/lib/gpx/exportGpx'
import { downloadFile } from '@/lib/utils/downloadFile'
import { generateId } from '@/lib/utils/ids'
import Toolbar from '@/components/editor/Toolbar'
import PointsSidebar from '@/components/editor/PointsSidebar'
import ElevationStrip from '@/components/editor/ElevationStrip'
import AddByKmModal from '@/components/editor/AddByKmModal'

const RouteMap = dynamic(() => import('@/components/map/RouteMap'), { ssr: false })

const DEFAULT_STATE: EditorState = {
  route: null,
  routeGeoJSON: null,
  markers: [],
  fileName: null,
}

export default function EditorPage() {
  const router = useRouter()
  const [state, setState] = useState<EditorState>(DEFAULT_STATE)
  const [activeType, setActiveType] = useState<PointType>('puerto')
  const [showKmModal, setShowKmModal] = useState(false)
  const [hoverPoint, setHoverPoint] = useState<{ lat: number; lon: number } | null>(null)
  const [pacingZones, setPacingZones] = useState<PacingZone[]>([])
  const [ftp, setFtp] = useState(0)
  const elevationRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('gpx-editor-data')
    if (stored) {
      try {
        setState(JSON.parse(stored))
      } catch {
        router.replace('/')
      }
    }
  }, [router])

  const handleUpload = useCallback((text: string, name: string) => {
    try {
      const route = parseGpx(text)
      const routeGeoJSON = routeToGeoJSON(route)
      setState((prev) => ({ ...prev, route, routeGeoJSON, fileName: name, markers: [] }))
      setPacingZones([])
    } catch {
      alert('Error al procesar el archivo GPX')
    }
  }, [])

  const handleMapClick = useCallback((lng: number, lat: number, distFromStart: number) => {
    const cfg = POINT_CONFIG[activeType]
    const marker: RouteMarker = {
      id: generateId(),
      type: activeType,
      label: cfg.label,
      lat,
      lon: lng,
      distanceFromStart: distFromStart,
    }
    setState((prev) => ({ ...prev, markers: [...prev.markers, marker] }))
  }, [activeType])

  const handleDelete = useCallback((id: string) => {
    setState((prev) => ({ ...prev, markers: prev.markers.filter((m) => m.id !== id) }))
  }, [])

  const handleEdit = useCallback((id: string, label: string) => {
    setState((prev) => ({
      ...prev,
      markers: prev.markers.map((m) => (m.id === id ? { ...m, label } : m)),
    }))
  }, [])

  const handleAddByKm = useCallback(
    (km: number, type: PointType, label: string) => {
      if (!state.routeGeoJSON) return
      const [lng, lat] = pointAtKm(state.routeGeoJSON, km)
      const marker: RouteMarker = {
        id: generateId(),
        type,
        label,
        lat,
        lon: lng,
        distanceFromStart: km,
      }
      setState((prev) => ({ ...prev, markers: [...prev.markers, marker] }))
      setShowKmModal(false)
    },
    [state.routeGeoJSON]
  )

  const handleExport = useCallback(() => {
    if (!state.route || !state.fileName) return
    const gpxStr = exportGpx(state.route, state.markers, state.fileName)
    downloadFile(gpxStr, `${state.fileName}-editado.gpx`, 'application/gpx+xml')
  }, [state])

  const handleExportPacing = useCallback(async () => {
    const elevEl = elevationRef.current
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = mapInstanceRef.current as any
    if (!elevEl) return

    const scale = 2
    const html2canvas = (await import('html2canvas')).default

    // Elevation strip canvas
    const elevCanvas = await html2canvas(elevEl, { backgroundColor: '#1a1a1a', scale })

    // Map canvas (WebGL — must use map's own canvas)
    let mapImgData: string | null = null
    if (map) {
      try {
        map.getCanvas().getContext('webgl', { preserveDrawingBuffer: true })
        mapImgData = map.getCanvas().toDataURL('image/png')
      } catch { /* map not ready */ }
    }

    const elevW = elevCanvas.width
    const elevH = elevCanvas.height
    const mapH = mapImgData ? elevW * 0.55 : 0

    const out = document.createElement('canvas')
    out.width = elevW
    out.height = Math.round(mapH) + elevH
    const ctx = out.getContext('2d')!
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, out.width, out.height)

    if (mapImgData) {
      const img = new Image()
      await new Promise<void>((res) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, elevW, Math.round(mapH))
          res()
        }
        img.src = mapImgData!
      })
    }

    ctx.drawImage(elevCanvas, 0, Math.round(mapH))

    out.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${state.fileName ?? 'pacing'}-zonas.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }, [state.fileName])

  const totalKm = state.routeGeoJSON ? totalRouteDistance(state.routeGeoJSON) : 0
  const totalGain = state.route
    ? totalElevationGain(state.route.map((p) => p.ele))
    : 0

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      <Toolbar
        fileName={state.fileName}
        totalKm={totalKm}
        totalGain={totalGain}
        onUpload={handleUpload}
        onExport={handleExport}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <RouteMap
          routeGeoJSON={state.routeGeoJSON}
          markers={state.markers}
          onMapClick={handleMapClick}
          hoverPoint={hoverPoint}
          pacingZones={pacingZones}
          onMapReady={(m) => { mapInstanceRef.current = m }}
        />
        <PointsSidebar
          markers={state.markers}
          activeType={activeType}
          onTypeChange={setActiveType}
          onDelete={handleDelete}
          onEdit={handleEdit}
          hasRoute={!!state.routeGeoJSON}
          totalKm={totalKm}
          onAddByKm={() => setShowKmModal(true)}
          pacingZones={pacingZones}
          ftp={ftp}
          onFtpChange={setFtp}
          onAddZone={(z) => setPacingZones((prev) => [...prev, z])}
          onDeleteZone={(id) => setPacingZones((prev) => prev.filter((z) => z.id !== id))}
          onExportPacing={handleExportPacing}
        />
      </div>

      {state.route && state.route.some((p) => p.ele != null) && (
        <ElevationStrip
          route={state.route}
          totalKm={totalKm}
          onHover={(pt) => setHoverPoint(pt ? { lat: pt.lat, lon: pt.lon } : null)}
          pacingZones={pacingZones}
          exportRef={elevationRef}
        />
      )}

      {showKmModal && (
        <AddByKmModal
          totalKm={totalKm}
          activeType={activeType}
          onConfirm={handleAddByKm}
          onClose={() => setShowKmModal(false)}
        />
      )}
    </div>
  )
}
