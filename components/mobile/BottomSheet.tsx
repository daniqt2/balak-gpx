'use client'

import { useRef, useState, useEffect, ReactNode } from 'react'
import { useT } from '@/lib/i18n'

type Snap = 'peek' | 'half' | 'full'
const PEEK_H = 96  // px visible when collapsed

interface BottomSheetProps {
  children: (snap: Snap) => ReactNode
}

export default function BottomSheet({ children }: BottomSheetProps) {
  const [snap, setSnap] = useState<Snap>('peek')
  const [dragging, setDragging] = useState(false)
  const [dragDelta, setDragDelta] = useState(0)
  const startY = useRef(0)
  const startDelta = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  function snapToY(s: Snap, containerH: number): number {
    if (s === 'peek') return containerH - PEEK_H
    if (s === 'half') return containerH * 0.42
    return 0
  }

  function currentTranslate(containerH: number): number {
    const base = snapToY(snap, containerH)
    return Math.max(0, Math.min(containerH - PEEK_H, base + dragDelta))
  }

  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY
    startDelta.current = dragDelta
    setDragging(true)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging) return
    const dy = e.touches[0].clientY - startY.current
    setDragDelta(startDelta.current + dy)
  }

  function onTouchEnd() {
    setDragging(false)
    const containerH = sheetRef.current?.parentElement?.clientHeight ?? window.innerHeight
    const ty = currentTranslate(containerH)
    const ratio = ty / containerH

    // snap to nearest
    if (ratio < 0.2) setSnap('full')
    else if (ratio < 0.65) setSnap('half')
    else setSnap('peek')
    setDragDelta(0)
  }

  const containerH = typeof window !== 'undefined'
    ? (sheetRef.current?.parentElement?.clientHeight ?? window.innerHeight)
    : 600

  const translateY = dragging
    ? currentTranslate(containerH)
    : snapToY(snap, containerH)

  return (
    <div
      ref={sheetRef}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        transform: `translateY(${translateY}px)`,
        transition: dragging ? 'none' : 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
        background: 'var(--surface)',
        borderRadius: '16px 16px 0 0',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
      }}
    >
      {/* Drag handle */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          padding: '12px 0 6px',
          display: 'flex',
          justifyContent: 'center',
          flexShrink: 0,
          cursor: 'grab',
          touchAction: 'none',
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#333' }} />
      </div>

      {children(snap)}
    </div>
  )
}
