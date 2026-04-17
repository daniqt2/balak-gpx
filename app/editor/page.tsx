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
import { exportPacingImage } from '@/lib/export/exportPacingImage'
import Toolbar from '@/components/editor/Toolbar'
import PointsSidebar from '@/components/editor/PointsSidebar'
import ElevationStrip from '@/components/editor/ElevationStrip'
import AddByKmModal from '@/components/editor/AddByKmModal'
import MobileEditor from '@/components/mobile/MobileEditor'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

const RouteMap = dynamic(() => import('@/components/map/RouteMap'), { ssr: false })

const DEFAULT_STATE: EditorState = {
  route: null,
  routeGeoJSON: null,
  markers: [],
  fileName: null,
  fileRenamed: false,
}

export default function EditorPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [state, setState] = useState<EditorState>(DEFAULT_STATE)
  const [activeType, setActiveType] = useState<PointType>('puerto')
  const [showKmModal, setShowKmModal] = useState(false)
  const [hoverPoint, setHoverPoint] = useState<{ lat: number; lon: number } | null>(null)
  const [pacingZones, setPacingZones] = useState<PacingZone[]>([])
  const [ftp, setFtp] = useState(0)
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
      setState((prev) => ({ ...prev, route, routeGeoJSON, fileName: name, markers: [], fileRenamed: false }))
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

  const totalKm = state.routeGeoJSON ? totalRouteDistance(state.routeGeoJSON) : 0
  const totalGain = state.route
    ? totalElevationGain(state.route.map((p) => p.ele))
    : 0

  const handleExport = useCallback(() => {
    if (!state.route || !state.fileName) return
    const gpxStr = exportGpx(state.route, state.markers, state.fileName)
    const exportName = state.fileRenamed ? state.fileName : `${state.fileName}-editado`
    downloadFile(gpxStr, `${exportName}.gpx`, 'application/gpx+xml')
  }, [state])

  const handleSendToGarmin = useCallback(() => {
    if (!state.route || !state.fileName) return
    const gpxStr = exportGpx(state.route, state.markers, state.fileName)
    const exportName = state.fileRenamed ? state.fileName : `${state.fileName}-editado`
    downloadFile(gpxStr, `${exportName}.gpx`, 'application/gpx+xml')
    window.open('https://connect.garmin.com/modern/import-data', '_blank')
  }, [state])

  const handleExportPacing = useCallback(async () => {
    if (!state.routeGeoJSON || !state.route) return
    await exportPacingImage(
      state.routeGeoJSON,
      pacingZones,
      state.route,
      totalKm,
      ftp,
      state.fileName ?? 'ruta'
    )
  }, [state.routeGeoJSON, state.route, pacingZones, totalKm, ftp, state.fileName])

  if (isMobile) {
    return (
      <MobileEditor
        state={state}
        activeType={activeType}
        pacingZones={pacingZones}
        ftp={ftp}
        totalKm={totalKm}
        totalGain={totalGain}
        onUpload={handleUpload}
        onExport={handleExport}
        onSendToGarmin={handleSendToGarmin}
        onMapClick={handleMapClick}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onTypeChange={setActiveType}
        onFtpChange={setFtp}
        onAddZone={(z) => setPacingZones((prev) => [...prev, z])}
        onDeleteZone={(id) => setPacingZones((prev) => prev.filter((z) => z.id !== id))}
        onExportPacing={handleExportPacing}
        onAddByKm={handleAddByKm}
      />
    )
  }

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
        onRename={(name) => setState((prev) => ({ ...prev, fileName: name, fileRenamed: true }))}
        onSendToGarmin={handleSendToGarmin}
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
          markers={state.markers}
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
