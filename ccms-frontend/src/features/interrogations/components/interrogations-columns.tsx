'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { StatusBadge } from '@/shared/components/display/StatusBadge'

import type { InterrogationListItem, RoleOnCase } from '../types/interrogation.types'

type BadgeVariant = 'primary' | 'warning' | 'accent' | 'success' | 'muted' | 'destructive'

const ROLE_BADGE_VARIANTS: Record<RoleOnCase, BadgeVariant> = {
  SUSPECT: 'accent',
  VICTIM: 'muted',
  WITNESS: 'muted',
}

interface InterrogationColumnsOptions {
  onViewDetails: (interrogationId: string) => void
}

function formatDuration(minutes: number, t: (key: string, values?: Record<string, any>) => string) {
  if (minutes < 60) return t('tab.durationValue', { minutes })
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function useInterrogationColumns({
  onViewDetails,
}: InterrogationColumnsOptions): ColumnDef<InterrogationListItem>[] {
  const t = useTranslations('interrogations')

  return [
    {
      accessorKey: 'interrogationNumber',
      header: t('tab.columns.interrogationNumber'),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-[var(--color-primary)]">
          {row.original.interrogationNumber}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'subject',
      header: t('tab.columns.subject'),
      cell: ({ row }) => {
        const subject = row.original.subject
        return (
          <div className="flex flex-wrap items-center gap-2">
            <span>{`${subject.firstName} ${subject.lastName}`}</span>
            <StatusBadge
              status={t(`roleOnCase.${subject.roleOnCase}`)}
              variant={ROLE_BADGE_VARIANTS[subject.roleOnCase] ?? 'muted'}
              className="w-auto px-2"
            />
          </div>
        )
      },
    },
    {
      accessorKey: 'conductingOfficer',
      header: t('tab.columns.conductingOfficer'),
      cell: ({ row }) => {
        const officer = row.original.conductingOfficer
        return <span>{`${officer.firstName} ${officer.lastName} (${officer.badgeNumber})`}</span>
      },
    },
    {
      accessorKey: 'interrogationDate',
      header: t('tab.columns.interrogationDate'),
      cell: ({ row }) => (
        <span>{format(new Date(row.original.interrogationDate), 'dd MMM yyyy HH:mm')}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'location',
      header: t('tab.columns.location'),
      cell: ({ row }) => {
        const location = row.original.location
        const display = location.length > 40 ? `${location.slice(0, 40)}...` : location
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate max-w-[180px] block">{display}</span>
              </TooltipTrigger>
              <TooltipContent>{location}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: 'durationMinutes',
      header: t('tab.columns.duration'),
      cell: ({ row }) => {
        const duration = row.original.durationMinutes
        return (
          <span>{
            duration === null
              ? t('tab.durationUnknown')
              : formatDuration(duration, t)
          }</span>
        )
      },
    },
    {
      accessorKey: 'legalRepresentativePresent',
      header: t('tab.columns.legalRep'),
      cell: ({ row }) => {
        const present = row.original.legalRepresentativePresent
        return (
          <StatusBadge
            status={present ? t('tab.legalRepYes') : t('tab.legalRepNo')}
            variant={present ? 'success' : 'muted'}
            className="w-[90px] text-center"
          />
        )
      },
    },
    {
      id: 'actions',
      header: t('tab.columns.actions'),
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(row.original.id)}>
              {t('tab.rowActions.view')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
