'use client'

import { useMemo, useRef, useState } from 'react'
import { RoutePoint } from '@/types/route'
import { PacingZone } from '@/types/pacing'

interface ElevationStripProps {
  route: RoutePoint[]
  totalKm: number
  onHover: (point: RoutePoint | null) => void
  pacingZones?: PacingZone[]
  exportRef?: React.RefObject<HTMLDivElement | null>
}

const W = 800
const H = 52

export default function ElevationStrip({ route, totalKm, onHover, pacingZones = [], exportRef }: ElevationStripProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [cursor, setCursor] = useState<{
    svgX: number
    pxRatio: number
    km: number
    ele: number
  } | null>(null)

  const data = useMemo(() => {
    const pts = route.filter((p) => p.ele != null && p.ele > 0)
    if (pts.length < 2) return null

    const min = Math.min(...pts.map((p) => p.ele!))
    const max = Math.max(...pts.map((p) => p.ele!))
    const range = max - min || 1

    const coords = pts.map((p, i) => {
      const x = (i / (pts.length - 1)) * W
      const y = H - ((p.ele! - min) / range) * (H - 6) - 3
      return { x, y, point: p, km: (i / (pts.length - 1)) * totalKm }
    })

    const linePath = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(' ')
    const fillPath = linePath + ` L${W},${H} L0,${H} Z`

    return { coords, linePath, fillPath }
  }, [route, totalKm])

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!data || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const svgX = ratio * W
    const idx = Math.round(ratio * (data.coords.length - 1))
    const clamped = Math.max(0, Math.min(data.coords.length - 1, idx))
    const coord = data.coords[clamped]
    setCursor({ svgX, pxRatio: ratio, km: coord.km, ele: coord.point.ele! })
    onHover(coord.point)
  }

  function handleMouseLeave() {
    setCursor(null)
    onHover(null)
  }

  if (!data) return null

  return (
    <div
      ref={exportRef}
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        height: 80,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: 'var(--text-muted)',
          fontSize: 10,
          whiteSpace: 'nowrap',
          letterSpacing: 1,
        }}
      >
        ELEVACIÓN
      </span>

      <div style={{ flex: 1, height: H + 4, position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="elev-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#e94560" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#e94560" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* pacing zone bands */}
          {pacingZones.map((zone) => {
            const x1 = (zone.kmStart / totalKm) * W
            const x2 = (zone.kmEnd / totalKm) * W
            return (
              <rect
                key={zone.id}
                x={x1}
                y={0}
                width={x2 - x1}
                height={H}
                fill={zone.color}
                opacity={0.2}
              />
            )
          })}
          <path d={data.fillPath} fill="url(#elev-grad)" />
          <path d={data.linePath} stroke="#e94560" strokeWidth="1.5" fill="none" />

          {cursor && (
            <line
              x1={cursor.svgX}
              y1={0}
              x2={cursor.svgX}
              y2={H}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}
        </svg>

        {/* HTML tooltip — no SVG text scaling issues */}
        {cursor && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `clamp(0px, calc(${cursor.pxRatio * 100}% - 52px), calc(100% - 104px))`,
              pointerEvents: 'none',
              background: '#111',
              border: '1px solid var(--border)',
              borderTop: '2px solid #e94560',
              borderRadius: '0 0 6px 6px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
              {cursor.km.toFixed(1)} km
            </span>
            <span style={{ color: '#666', fontSize: 11 }}>·</span>
            <span style={{ color: '#aaa', fontSize: 12 }}>
              {Math.round(cursor.ele)} m
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
