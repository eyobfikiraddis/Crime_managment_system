'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import {
  Building2, Tag, User, Calendar, FileText, CheckCircle, Clock, MapPin,
  Files, UserCheck, Scale, ArrowRight, UserPlus, Eye, Shield,
  ArrowRightLeft, Upload, UserMinus, Gavel, KeyRound, AlertTriangle
} from 'lucide-react'

// Safe date formatter to avoid "Invalid time value" errors
function safeFormat(dateStr: string | null | undefined, dateFormat: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return format(d, dateFormat)
  } catch {
    return '—'
  }
}

function safeFormatDistance(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return '—'
  }
}

import { useCase } from '../hooks/useCase'
import { useCaseSummary } from '../hooks/useCaseSummary'
import { useCaseOfficers } from '../hooks/useCaseOfficers'
import { useCaseTimeline } from '../hooks/useCaseTimeline'
import type { CaseStatus, TimelineEventType } from '../types/case.types'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { EmptyState } from '@/shared/components/display/EmptyState'
import { MetadataCard } from '@/shared/components/display/MetadataCard'
import { StatusBadge } from '@/shared/components/display/StatusBadge'
import { SectionHeader } from '@/shared/components/display/SectionHeader'
import { Timeline } from '@/shared/components/timeline/Timeline'
import { TimelineEntry } from '@/shared/components/timeline/TimelineEntry'

const STATUS_VARIANT_MAP: Record<CaseStatus, 'primary' | 'warning' | 'accent' | 'success' | 'muted'> = {
  OPEN: 'primary',
  UNDER_INVESTIGATION: 'warning',
  REFERRED_TO_COURT: 'accent',
  CLOSED: 'success',
  ARCHIVED: 'muted',
}

const EVENT_ICON_MAP: Record<TimelineEventType, any> = {
  CASE_CREATED: Clock,
  CASE_UPDATED: FileText,
  STATUS_CHANGED: ArrowRightLeft,
  EVIDENCE_ADDED: Upload,
  EVIDENCE_UPDATED: Upload,
  OFFICER_ASSIGNED: UserPlus,
  OFFICER_REMOVED: UserMinus,
  ARREST_RECORDED: Shield,
  INTERROGATION_RECORDED: Eye,
  LEGAL_ACTION: Gavel,
  NOTE_ADDED: FileText,
  PERMISSION_CHANGED: KeyRound,
  LOGIN_FAILURE: AlertTriangle,
}

interface CaseOverviewTabProps {
  caseId: string
}

export function CaseOverviewTab({ caseId }: CaseOverviewTabProps) {
  const t = useTranslations('cases')

  const { data: caseDetail, isLoading: isCaseLoading } = useCase(caseId)
  const { data: summary, isLoading: isSummaryLoading } = useCaseSummary(caseId)
  const { data: officers, isLoading: isOfficersLoading } = useCaseOfficers(caseId)
  const { data: recentActivity, isLoading: isActivityLoading } = useCaseTimeline({
    caseId,
    filters: { page: 1, pageSize: 5 },
    enabled: true,
  })

  const [showFullDesc, setShowFullDesc] = useState(false)

  if (isCaseLoading || isSummaryLoading || isOfficersLoading || isActivityLoading) {
    return <CaseOverviewTabSkeleton />
  }

  if (!caseDetail) {
    return <EmptyState title={t('detail.notFound')} />
  }

  console.log("OFFICERS DATA: ", officers)
  const desc = caseDetail.description ?? ''
  const isDescLong = desc.length > 300
  const displayDesc = showFullDesc ? desc : desc.slice(0, 300) + (isDescLong ? '...' : '')

  const statusVariant = STATUS_VARIANT_MAP[caseDetail.status] ?? 'primary'

  // Metadata Card Items
  const metadataItems = [
    { label: t('detail.headerCard.caseNumberLabel'), value: <span className="font-mono">{caseDetail.caseNumber}</span> },
    { label: t('list.columns.status'), value: <StatusBadge status={t(`status.${caseDetail.status}`)} variant={statusVariant} /> },
    { label: t('detail.headerCard.departmentLabel'), value: caseDetail.department.name },
    { label: t('detail.headerCard.crimeTypeLabel'), value: caseDetail.crimeType.name },
    {
      label: t('detail.headerCard.leadOfficerLabel'),
      value: (
        <Link
          href={`/personnel/officers/${caseDetail.leadOfficer.id}`}
          className="text-primary hover:underline font-medium"
        >
          {`${caseDetail.leadOfficer.firstName} ${caseDetail.leadOfficer.lastName}`}
        </Link>
      ),
    },
    { label: t('create.step1.locationLabel'), value: caseDetail.location?.name ?? '—' },
    { label: t('detail.headerCard.incidentDateLabel'), value: safeFormat(caseDetail.incidentDate, 'dd MMM yyyy') },
    { label: t('detail.headerCard.reportedDateLabel'), value: safeFormat(caseDetail.reportedDate, 'dd MMM yyyy') },
    { label: t('detail.headerCard.closedDateLabel'), value: safeFormat(caseDetail.closedDate, 'dd MMM yyyy') },
    { label: t('list.columns.lastActivity'), value: safeFormatDistance(caseDetail.lastActivityAt) },
  ]

  // Summary statistics row data
  const stats = [
    {
      title: t('overview.summaryPanels.evidence'),
      count: summary?.evidenceCount ?? 0,
      icon: Files,
      href: `/cases/${caseId}/evidence`,
    },
    {
      title: t('overview.summaryPanels.arrests'),
      count: summary?.arrestCount ?? 0,
      icon: UserCheck,
      href: `/cases/${caseId}/arrests`,
    },
    {
      title: t('overview.summaryPanels.charges'),
      count: summary?.chargeCount ?? 0,
      icon: Scale,
      href: `/cases/${caseId}/legal`,
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Columns */}
      <div className="lg:col-span-2 space-y-6 flex flex-col">
        {/* Description Section */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t('overview.descriptionCard')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="text-sm font-sans text-foreground whitespace-pre-wrap leading-relaxed">
              {displayDesc}
            </pre>
            {isDescLong && (
              <button
                type="button"
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="text-xs font-semibold text-primary hover:underline mt-1"
              >
                {showFullDesc ? 'Show less' : 'Show more'}
              </button>
            )}
          </CardContent>
        </Card>

        {/* Summary statistics grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.href} className="border-border bg-card hover:bg-muted/10 transition">
                <CardContent className="p-4 flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground-muted uppercase tracking-wider font-semibold">
                      {stat.title}
                    </span>
                    <Icon className="h-5 w-5 text-foreground-muted" />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold tracking-tight text-foreground">{stat.count}</span>
                    <Link
                      href={stat.href}
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1 group"
                    >
                      {t('overview.summaryPanels.viewAll')}
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Assigned Officers section */}
        <Card className="border-border bg-card flex-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t('overview.officersSection')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!officers || officers.length === 0 ? (
              <div className="p-6">
                <EmptyState title={t('overview.officersSectionEmpty')} />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {(officers || []).map((member: any) => {
                  const initials = `${member.officer.firstName?.[0] ?? ''}${member.officer.lastName?.[0] ?? ''}`.toUpperCase()
                  return (
                    <div key={member.officer.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs font-semibold bg-muted/40 text-foreground">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link
                            href={`/personnel/officers/${member.officer.id}`}
                            className="text-sm font-semibold text-foreground hover:text-primary hover:underline transition"
                          >
                            {`${member.officer.firstName} ${member.officer.lastName}`}
                          </Link>
                          <p className="text-xs text-foreground-muted mt-0.5">
                            {member.officer.badgeNumber} · {member.officer.departmentName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px] font-semibold tracking-wider">
                          {member.accessLevel}
                        </Badge>
                        <span className="text-xs text-foreground-muted hidden sm:inline">
                          Assigned {safeFormat(member.assignedAt, 'dd MMM yyyy')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Metadata Details Card */}
        <MetadataCard title={t('overview.metadataCard')} items={metadataItems} />

        {/* Recent Activity strip */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">{t('overview.recentActivity')}</CardTitle>
            {recentActivity && recentActivity.total > 0 && (
              <Link href={`/cases/${caseId}/timeline`} className="text-xs font-semibold text-primary hover:underline">
                {t('overview.viewAllActivity')}
              </Link>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {!recentActivity || recentActivity.data.length === 0 ? (
              <p className="text-sm text-foreground-muted">{t('overview.recentActivityEmpty')}</p>
            ) : (
              <Timeline>
                {recentActivity.data.map((entry) => {
                  const Icon = EVENT_ICON_MAP[entry.eventType] ?? Clock
                  return (
                    <TimelineEntry
                      key={entry.id}
                      icon={Icon}
                      eventType={t(`timeline.eventTypes.${entry.eventType}`)}
                      actor={`${entry.actor.firstName} ${entry.actor.lastName}`}
                      timestamp={safeFormatDistance(entry.createdAt)}
                      description={entry.description}
                    />
                  )
                })}
              </Timeline>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CaseOverviewTabSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-[450px] w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}
