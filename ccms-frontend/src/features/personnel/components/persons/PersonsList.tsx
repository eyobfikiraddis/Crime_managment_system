'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs'
import { PageHeader } from '@shared/components/display/PageHeader'
import { usePersonList } from '@features/personnel/hooks/usePersonList'
import type { PersonFilters } from '@features/personnel/types/personnel.types'

export function PersonsList() {
  const t = useTranslations('personnel')

  const [q, setQ] = useQueryStates({
    search: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(25),
  })

  const filters = ({ ...(q.search ? { search: q.search } : {}), page: q.page, pageSize: q.pageSize }) as unknown as PersonFilters

  const { data, isLoading } = usePersonList(filters)

  return (
    <div className="space-y-6">
      <PageHeader title={t('persons.pageTitle')} description={t('persons.list.heading')} />

      <div className="bg-card rounded-md p-4">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="text-left text-foreground-muted">
                <th className="px-2 py-2">{t('persons.list.columns.name')}</th>
                <th className="px-2 py-2">{t('persons.list.columns.nationalId')}</th>
                <th className="px-2 py-2">{t('persons.list.columns.roles')}</th>
                <th className="px-2 py-2">{t('persons.list.columns.riskLevel')}</th>
                <th className="px-2 py-2">{t('persons.list.columns.createdAt')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-foreground-muted">{t('common.loading')}</td>
                </tr>
              )}
              {data?.data.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-2 py-3">
                    <Link href={`/personnel/persons/${p.id}`} className="font-medium text-primary hover:underline">
                      {p.firstName} {p.lastName}
                    </Link>
                  </td>
                  <td className="px-2 py-3">{p.nationalIdMasked ?? '-'}</td>
                  <td className="px-2 py-3">{p.roles.join(', ')}</td>
                  <td className="px-2 py-3">{p.riskLevel ?? '-'}</td>
                  <td className="px-2 py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
