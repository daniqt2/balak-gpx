'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useT } from '@/lib/i18n'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Feature, LineString } from 'geojson'
import { RouteMarker, POINT_CONFIG } from '@/types/points'
import { PacingZone } from '@/types/pacing'
import { snapToRoute } from '@/lib/geo/snapToRoute'
import { distanceOnRoute } from '@/lib/geo/distanceOnRoute'
import { sliceRouteByKm } from '@/lib/geo/sliceRoute'

interface RouteMapProps {
  routeGeoJSON: Feature<LineString> | null
  markers: RouteMarker[]
  onMapClick: (lng: number, lat: number, distFromStart: number) => void
  hoverPoint: { lat: number; lon: number } | null
  pacingZones: PacingZone[]
  onMapReady?: (map: maplibregl.Map) => void
}

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

export default function RouteMap({ routeGeoJSON, markers, onMapClick, hoverPoint, pacingZones, onMapReady }: RouteMapProps) {
  const { t } = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const hoverMarkerRef = useRef<maplibregl.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [TILE_URL],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [-3.7, 40.4],
      zoom: 6,
      // needed for map.getCanvas().toDataURL() export
      ...(({ preserveDrawingBuffer: true } as unknown) as object),
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = map
    onMapReady?.(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    function onLoad() {
      if (!routeGeoJSON) return
      const m = mapRef.current!

      if (m.getSource('route')) {
        (m.getSource('route') as maplibregl.GeoJSONSource).setData(routeGeoJSON)
      } else {
        m.addSource('route', { type: 'geojson', data: routeGeoJSON })
        m.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#e94560',
            'line-width': 3,
            'line-opacity': 0.9,
          },
        })
      }

      const coords = routeGeoJSON.geometry.coordinates
      const bounds = coords.reduce(
        (b, c) => b.extend(c as [number, number]),
        new maplibregl.LngLatBounds(
          coords[0] as [number, number],
          coords[0] as [number, number]
        )
      )
      m.fitBounds(bounds, { padding: 60 })
    }

    if (map.isStyleLoaded()) {
      onLoad()
    } else {
      map.once('load', onLoad)
    }
  }, [routeGeoJSON])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !routeGeoJSON) return

    function handleClick(e: maplibregl.MapMouseEvent) {
      const { lng, lat } = e.lngLat
      const [snappedLng, snappedLat] = snapToRoute(lng, lat, routeGeoJSON!)
      const dist = distanceOnRoute(routeGeoJSON!, snappedLng, snappedLat)
      onMapClick(snappedLng, snappedLat, dist)
    }

    map.on('click', handleClick)
    map.getCanvas().style.cursor = 'crosshair'
    return () => {
      map.off('click', handleClick)
      map.getCanvas().style.cursor = ''
    }
  }, [routeGeoJSON, onMapClick])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    markers.forEach((marker) => {
      const cfg = POINT_CONFIG[marker.type]
      const el = document.createElement('div')
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 50%;
        background: ${cfg.color}; border: 2px solid #fff;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      `
      el.title = marker.label
      el.textContent = cfg.emoji

      const m = new maplibregl.Marker({ element: el })
        .setLngLat([marker.lon, marker.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 20 }).setHTML(
            `<strong>${marker.label}</strong><br>km ${marker.distanceFromStart.toFixed(1)}`
          )
        )
        .addTo(map)

      markersRef.current.push(m)
    })
  }, [markers])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const existingIds: string[] = (map as unknown as { _pacingLayerIds?: string[] })._pacingLayerIds ?? []
    existingIds.forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id)
      if (map.getSource(id)) map.removeSource(id)
    })

    if (!routeGeoJSON || pacingZones.length === 0) {
      // restore base route opacity
      if (map.getLayer('route-line')) map.setPaintProperty('route-line', 'line-opacity', 0.9)
      ;(map as unknown as { _pacingLayerIds?: string[] })._pacingLayerIds = []
      return
    }

    if (map.getLayer('route-line')) map.setPaintProperty('route-line', 'line-opacity', 0.15)

    const newIds: string[] = []
    pacingZones.forEach((zone) => {
      try {
        const segment = sliceRouteByKm(routeGeoJSON, zone.kmStart, zone.kmEnd)
        const srcId = `pacing-${zone.id}`
        map.addSource(srcId, { type: 'geojson', data: segment })
        map.addLayer({
          id: srcId,
          type: 'line',
          source: srcId,
          paint: { 'line-color': zone.color, 'line-width': 4, 'line-opacity': 0.85 },
        })
        newIds.push(srcId)
      } catch { /* zone out of range */ }
    })
    ;(map as unknown as { _pacingLayerIds?: string[] })._pacingLayerIds = newIds
  }, [pacingZones, routeGeoJSON])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!hoverPoint) {
      hoverMarkerRef.current?.remove()
      hoverMarkerRef.current = null
      return
    }

    const el = document.createElement('div')
    el.style.cssText = `
      width: 12px; height: 12px; border-radius: 50%;
      background: #fff; border: 2px solid #e94560;
      box-shadow: 0 0 0 3px rgba(233,69,96,0.3);
      pointer-events: none;
    `

    if (hoverMarkerRef.current) {
      hoverMarkerRef.current.setLngLat([hoverPoint.lon, hoverPoint.lat])
    } else {
      hoverMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([hoverPoint.lon, hoverPoint.lat])
        .addTo(map)
    }
  }, [hoverPoint])

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {!routeGeoJSON && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            color: '#bbb',
            fontSize: 12,
            padding: '6px 14px',
            borderRadius: 20,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {t('map.no_route')}
        </div>
      )}
      {routeGeoJSON && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            color: '#bbb',
            fontSize: 12,
            padding: '6px 14px',
            borderRadius: 20,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {t('map.click_hint')}
        </div>
      )}
    </div>
  )
}
