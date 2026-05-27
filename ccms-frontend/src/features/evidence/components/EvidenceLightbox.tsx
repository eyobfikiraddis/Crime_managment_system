'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  Minus,
  Plus,
  X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@/shared/components/permission/PermissionGuard'
import { Permission } from '@/shared/constants/permissions'
import { cn } from '@/lib/utils'
import type { EvidenceListItem } from '../types/evidence.types'

interface EvidenceLightboxProps {
  photos: EvidenceListItem[]
  initialIndex: number
  open: boolean
  onClose: () => void
}

const MIN_SCALE = 0.5
const MAX_SCALE = 4

export function EvidenceLightbox({
  photos,
  initialIndex,
  open,
  onClose,
}: EvidenceLightboxProps) {
  const t = useTranslations('evidence')
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showMetadata, setShowMetadata] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isFullLoaded, setIsFullLoaded] = useState(false)
  const [zoomIndicator, setZoomIndicator] = useState<number | null>(null)
  const [reduceMotion, setReduceMotion] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const controlsTimerRef = useRef<number | null>(null)
  const panStartRef = useRef<{ x: number; y: number } | null>(null)

  const isTouch = useMemo(() => {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }, [])

  const currentPhoto = photos[currentIndex]

  const setZoom = useCallback((next: number) => {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next))
    setScale(clamped)
    setZoomIndicator(Math.round(clamped * 100))
    window.setTimeout(() => setZoomIndicator(null), 2000)
  }, [])

  const zoomIn = useCallback(() => setZoom(scale + 0.25), [scale, setZoom])
  const zoomOut = useCallback(() => setZoom(scale - 0.25), [scale, setZoom])
  const resetZoom = useCallback(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const navigatePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }, [photos.length])

  const navigateNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
  }, [photos.length])

  useEffect(() => {
    if (!open) return
    setCurrentIndex(initialIndex)
    setScale(1)
    setPan({ x: 0, y: 0 })
    setIsFullLoaded(false)
    setShowMetadata(false)
    closeButtonRef.current?.focus()
  }, [initialIndex, open])

  useEffect(() => {
    if (!open) return
    setIsFullLoaded(false)
  }, [currentIndex, open])

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') navigatePrev()
      if (event.key === 'ArrowRight') navigateNext()
      if (event.key === 'Escape') onClose()
      if (event.key === '+' || event.key === '=') zoomIn()
      if (event.key === '-') zoomOut()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigateNext, navigatePrev, onClose, zoomIn, zoomOut])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(media.matches)
    const handler = (event: MediaQueryListEvent) => setReduceMotion(event.matches)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  const handleMouseMove = () => {
    if (isTouch) return
    setShowControls(true)
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = window.setTimeout(() => setShowControls(false), 2000)
  }

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault()
    if (event.deltaY < 0) zoomIn()
    else zoomOut()
  }

  const handlePointerDown = (event: React.PointerEvent) => {
    if (scale <= 1) return
    panStartRef.current = { x: event.clientX - pan.x, y: event.clientY - pan.y }
  }

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!panStartRef.current) return
    setPan({ x: event.clientX - panStartRef.current.x, y: event.clientY - panStartRef.current.y })
  }

  const handlePointerUp = () => {
    panStartRef.current = null
  }

  const handleDownload = () => {
    if (!currentPhoto?.mediaUrl) return
    const anchor = document.createElement('a')
    anchor.href = currentPhoto.mediaUrl
    anchor.download = `${currentPhoto.evidenceNumber ?? 'evidence'}.jpg`
    anchor.click()
  }

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0]
    if (!touch) return
    panStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!panStartRef.current) return
    const endX = event.changedTouches[0]?.clientX ?? 0
    const deltaX = endX - panStartRef.current.x
    if (deltaX < -50) navigateNext()
    if (deltaX > 50) navigatePrev()
    panStartRef.current = null
  }

  if (!open || photos.length === 0 || !currentPhoto) {
    return null
  }

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] bg-black/95 text-white"
      onMouseMove={handleMouseMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-3">
        <Button
          ref={closeButtonRef}
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={onClose}
          aria-label={t('lightbox.closeLabel')}
        >
          <X className="size-4" />
        </Button>
        <div className="text-xs font-mono text-white/70">
          {t('lightbox.photoCount', { current: currentIndex + 1, total: photos.length })}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={() => setShowMetadata((prev) => !prev)}
            aria-label={showMetadata ? t('lightbox.closeMetadata') : t('lightbox.openMetadata')}
          >
            <Info className="size-4" />
          </Button>
          <PermissionGuard permission={Permission.EVIDENCE_MANAGE}>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={handleDownload}
              aria-label={t('lightbox.downloadLabel')}
            >
              <Download className="size-4" />
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div
          className={cn(
            'relative flex items-center justify-center overflow-hidden transition-[margin-right] duration-200',
            showMetadata ? 'mr-[320px]' : 'mr-0',
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {currentPhoto.thumbnailUrl ? (
            <img
              src={currentPhoto.thumbnailUrl}
              alt={currentPhoto.description}
              className={cn(
                'absolute max-h-[80vh] max-w-[80vw] object-contain transition-opacity duration-200',
                isFullLoaded ? 'opacity-0' : 'opacity-100',
              )}
              style={{ filter: 'blur(8px)' }}
            />
          ) : null}
          <img
            src={currentPhoto.mediaUrl ?? currentPhoto.thumbnailUrl ?? ''}
            alt={currentPhoto.description}
            className={cn(
              'max-h-[80vh] max-w-[80vw] object-contain transition-opacity duration-200',
              isFullLoaded || reduceMotion ? 'opacity-100' : 'opacity-0',
            )}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            }}
            onLoad={() => setIsFullLoaded(true)}
          />
        </div>
      </div>

      <div
        className={cn(
          'absolute inset-y-0 left-4 flex items-center transition-opacity',
          showControls || isTouch ? 'opacity-100' : 'opacity-0',
        )}
      >
        <Button
          variant="ghost"
          className="rounded-full bg-white/10 text-white hover:bg-white/20"
          onClick={navigatePrev}
          aria-label={t('lightbox.prevLabel')}
        >
          <ChevronLeft className="size-5" />
        </Button>
      </div>
      <div
        className={cn(
          'absolute inset-y-0 right-4 flex items-center transition-opacity',
          showControls || isTouch ? 'opacity-100' : 'opacity-0',
        )}
      >
        <Button
          variant="ghost"
          className="rounded-full bg-white/10 text-white hover:bg-white/20"
          onClick={navigateNext}
          aria-label={t('lightbox.nextLabel')}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2">
        <Button
          variant="ghost"
          className="rounded-full bg-white/10 text-white hover:bg-white/20"
          onClick={zoomOut}
          aria-label={t('lightbox.zoomOut')}
        >
          <Minus className="size-4" />
        </Button>
        <Button
          variant="ghost"
          className="rounded-full bg-white/10 text-white hover:bg-white/20"
          onClick={zoomIn}
          aria-label={t('lightbox.zoomIn')}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {zoomIndicator ? (
        <div className="absolute bottom-6 right-6 text-xs font-mono text-white/70">
          {zoomIndicator}%
        </div>
      ) : null}

      <div
        className={cn(
          'fixed right-0 top-0 h-full w-[320px] bg-black/90 px-4 py-6 text-sm transition-transform',
          showMetadata ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="space-y-2">
          <div className="text-xs uppercase text-white/60">{currentPhoto.evidenceNumber}</div>
          <div>{currentPhoto.description}</div>
          <div className="text-xs text-white/60">
            {t('detail.type')}: {t(`types.${currentPhoto.evidenceType}`)}
          </div>
          <div className="text-xs text-white/60">
            {t('detail.collectedAt')}: {new Date(currentPhoto.collectedAt).toISOString()}
          </div>
          <div className="text-xs text-white/60">
            {t('detail.collectedBy')}: {`${currentPhoto.collectedBy.firstName} ${currentPhoto.collectedBy.lastName}`}
          </div>
          <div className="text-xs text-white/60">
            {t('detail.storageLocation')}: {currentPhoto.storageLocation}
          </div>
        </div>
      </div>
    </div>
  )
}
