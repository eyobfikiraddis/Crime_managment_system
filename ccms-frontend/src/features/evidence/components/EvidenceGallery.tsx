'use client'

import { useEffect, useState } from 'react'
import { Eye, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { cn } from '@/lib/utils'
import type { EvidenceListItem } from '../types/evidence.types'

interface EvidenceGalleryProps {
  items: EvidenceListItem[]
  onView: (index: number) => void
  onDetails: (evidenceId: string) => void
}

function getThumbnailUrl(originalUrl: string): string {
  return originalUrl.replace('/upload/', '/upload/c_fill,w_320,h_240,q_auto,f_auto/')
}

export function EvidenceGallery({ items, onView, onDetails }: EvidenceGalleryProps) {
  const t = useTranslations('evidence')
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(media.matches)
    const handler = (event: MediaQueryListEvent) => setReduceMotion(event.matches)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  if (items.length === 0) {
    return (
      <EmptyState
        title={t('gallery.empty')}
        description={t('gallery.emptyDescription')}
      />
    )
  }

  return (
    <div
      data-testid="evidence-gallery"
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
    >
      {items.map((item, index) => {
        const thumbnail = item.thumbnailUrl
          ? item.thumbnailUrl
          : item.mediaUrl
            ? getThumbnailUrl(item.mediaUrl)
            : null

        return (
          <div
            key={item.id}
            className="group border border-border bg-card rounded-none overflow-hidden"
          >
            <div
              className="relative aspect-[4/3] bg-muted"
              onClick={() => onView(index)}
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={item.description}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}

              <div
                className={cn(
                  'absolute inset-0 flex items-end justify-between p-3 text-white transition-opacity',
                  reduceMotion ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}
                style={{
                  background:
                    'linear-gradient(to top, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0))',
                }}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    onView(index)
                  }}
                >
                  <Eye className="size-3" />
                  {t('gallery.hover.view')}
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDetails(item.id)
                  }}
                >
                  <Info className="size-3" />
                  {t('gallery.hover.details')}
                </button>
              </div>
            </div>
            <div className="px-3 py-2 space-y-1">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                {t('types.CRIME_SCENE_PHOTO')}
              </Badge>
              <div className="text-xs font-mono text-foreground-muted">
                {item.evidenceNumber}
              </div>
              <div className="text-xs text-foreground-muted">
                {new Date(item.collectedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
