'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs'
import { PageHeader } from '@shared/components/display/PageHeader'
import { useOfficerList } from '@features/personnel/hooks/useOfficerList'
import type { OfficerFilters } from '@features/personnel/types/personnel.types'

export function OfficersList() {
  const t = useTranslations('personnel')

  const [q, setQ] = useQueryStates({
    search: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(25),
  })

  const filters = ({ ...(q.search ? { search: q.search } : {}), page: q.page, pageSize: q.pageSize }) as unknown as OfficerFilters

  const { data, isLoading } = useOfficerList(filters)

  return (
    <div className="space-y-6">
      <PageHeader title={t('officers.pageTitle')} description={t('officers.list.heading')} />

      <div className="bg-card rounded-md p-4">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="text-left text-foreground-muted">
                <th className="px-2 py-2">{t('officers.list.columns.badge')}</th>
                <th className="px-2 py-2">{t('officers.list.columns.name')}</th>
                <th className="px-2 py-2">{t('officers.list.columns.role')}</th>
                <th className="px-2 py-2">{t('officers.list.columns.department')}</th>
                <th className="px-2 py-2">{t('officers.list.columns.status')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-foreground-muted">{t('common.loading')}</td>
                </tr>
              )}
              {data?.data.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-2 py-3">
                    <Link href={`/personnel/officers/${o.id}`} className="font-medium text-primary hover:underline">
                      {o.badgeNumber}
                    </Link>
                  </td>
                  <td className="px-2 py-3">{o.firstName} {o.lastName}</td>
                  <td className="px-2 py-3">{o.role}</td>
                  <td className="px-2 py-3">{o.departmentName}</td>
                  <td className="px-2 py-3">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default OfficersList
