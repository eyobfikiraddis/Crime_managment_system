'use client'

import { useEffect, useState } from 'react'
import { UploadCloud } from 'lucide-react'

import { Progress } from '@/components/ui/progress'

interface FileUploadZoneProps {
  accept: string
  maxSize: number
  onFile: (file: File) => void
  isUploading: boolean
  progress?: number
}

export function FileUploadZone({
  accept,
  maxSize,
  onFile,
  isUploading,
  progress = 0,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFile = (file: File) => {
    if (file.size > maxSize) {
      return
    }

    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      return
    }

    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    }

    onFile(file)
  }

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-8 text-center transition-colors ${
        isDragging ? 'bg-card-hover' : 'bg-card'
      }`}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        const file = event.dataTransfer.files?.[0]
        if (file) {
          handleFile(file)
        }
      }}
    >
      <UploadCloud className="size-6 text-foreground-muted" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-medium">Drag and drop a file here</p>
        <p className="text-xs text-foreground-muted">Max size: {Math.round(maxSize / 1024 / 1024)}MB</p>
      </div>
      {previewUrl ? (
        <img src={previewUrl} alt="Uploaded preview" className="h-24 w-24 rounded-md object-cover" />
      ) : null}
      {isUploading ? <Progress value={progress} className="w-full" /> : null}
    </div>
  )
}
