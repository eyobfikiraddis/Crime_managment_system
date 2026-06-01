'use client'

import { useTranslations } from 'next-intl'
import { Printer, Download, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { useDownloadAuditCsv } from '@features/audit/hooks/useDownloadAuditCsv'
import type { AuditFilters } from '@features/audit/types/audit.types'

interface AuditExportPanelProps {
  surface: 'case' | 'officer' | 'person' | 'global'
  entityId: string
  filters: AuditFilters
  printTitle?: string | undefined
}

export function AuditExportPanel({
  surface,
  entityId,
  filters,
  printTitle,
}: AuditExportPanelProps) {
  const t = useTranslations('audit')
  const downloadMutation = useDownloadAuditCsv()

  const handlePrint = () => {
    if (typeof window === 'undefined') return

    // Inject a print-only header into the DOM before printing
    const existing = document.getElementById('ccms-print-header')
    if (existing) existing.remove()

    const header = document.createElement('div')
    header.id = 'ccms-print-header'
    header.className = 'print-header'
    header.innerHTML = `
      <div class="print-classification">${t('export.printClassification')}</div>
      <div class="print-title">${t('export.printTitle')}</div>
      ${printTitle ? `<div class="print-subtitle text-center text-xs font-semibold mt-1">${printTitle}</div>` : ''}
      <div class="print-notice">${t('export.printAuthorisedNotice')}</div>
      <div class="print-notice">${t('export.printGeneratedAt', {
        datetime: format(new Date(), 'dd MMM yyyy HH:mm:ss'),
      })}</div>
    `
    document.body.prepend(header)
    window.print()

    // Remove the header after printing to keep the DOM clean
    setTimeout(() => {
      const el = document.getElementById('ccms-print-header')
      if (el) el.remove()
    }, 1000)
  }

  const handleCsvExport = () => {
    downloadMutation.mutate({
      surface,
      entityId,
      filters,
    })
  }

  return (
    <div className="flex items-center gap-2 print:hidden" data-export-panel="">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="h-8"
      >
        <Printer className="mr-1.5 h-3.5 w-3.5" />
        {t('export.printButton')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCsvExport}
        disabled={downloadMutation.isPending}
        className="h-8"
      >
        {downloadMutation.isPending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="mr-1.5 h-3.5 w-3.5" />
        )}
        {downloadMutation.isPending
          ? t('export.csvDownloading')
          : t('export.csvButton')}
      </Button>
    </div>
  )
}
