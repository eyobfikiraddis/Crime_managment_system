'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { caseKeys } from '@/services/query/keys/caseKeys'

import { navigationSections } from './navigation.config'

const titleCase = (value: string) =>
  value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const breadcrumbKeyBySegment: Record<string, string> = {
  dashboard: 'breadcrumbs.home',
  cases: 'breadcrumbs.cases',
  new: 'breadcrumbs.newCase',
  evidence: 'breadcrumbs.evidence',
  officers: 'breadcrumbs.officers',
  persons: 'breadcrumbs.persons',
  departments: 'breadcrumbs.departments',
  reports: 'breadcrumbs.reports',
  admin: 'breadcrumbs.admin',
  settings: 'breadcrumbs.settings',
  legal: 'breadcrumbs.legal',
  arrests: 'breadcrumbs.arrests',
  interrogations: 'breadcrumbs.interrogations',
  timeline: 'breadcrumbs.timeline',
  permissions: 'breadcrumbs.permissions',
}

export function Breadcrumb() {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const tNav = useTranslations('navigation')

  const items = useMemo(() => {
    const map = new Map<string, string>()
    navigationSections.forEach((section) => {
      section.items.forEach((item) => {
        map.set(item.href, tNav(item.label))
      })
    })

    const segments = pathname.split('/').filter(Boolean)
    const crumbs: { href: string; label: string; current?: boolean }[] = []
    let currentPath = ''

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1
      let label = map.get(currentPath)

      if (!label && segment) {
        const breadcrumbKey = breadcrumbKeyBySegment[segment]
        if (breadcrumbKey) {
          label = tNav(breadcrumbKey)
        }
      }

      if (!label && segment) {
        const cachedCase = queryClient.getQueryData<{ title?: string; name?: string }>(
          caseKeys.detail(segment),
        )
        label = cachedCase?.title ?? cachedCase?.name

        if (!label) {
          const cachedPerson = queryClient.getQueryData<{ firstName?: string; lastName?: string }>(
            ['persons', 'detail', segment]
          )
          if (cachedPerson) {
            label = `${cachedPerson.firstName ?? ''} ${cachedPerson.lastName ?? ''}`.trim()
          }
        }

        if (!label) {
          const cachedOfficer = queryClient.getQueryData<{ firstName?: string; lastName?: string }>(
            ['officers', 'detail', segment]
          )
          if (cachedOfficer) {
            label = `${cachedOfficer.firstName ?? ''} ${cachedOfficer.lastName ?? ''}`.trim()
          }
        }
      }

      crumbs.push({
        href: currentPath,
        label: label ?? titleCase(segment),
        current: isLast,
      })
    })

    return crumbs
  }, [pathname, queryClient, tNav])

  if (items.length === 0) {
    return null
  }

  return (
    <BreadcrumbRoot>
      <BreadcrumbList>
        {items.map((item, index) => (
          <BreadcrumbItem key={item.href}>
            {item.current ? (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link href={item.href}>{item.label}</Link>
              </BreadcrumbLink>
            )}
            {index < items.length - 1 ? <BreadcrumbSeparator /> : null}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </BreadcrumbRoot>
  )
}
