'use client'

import { useQuery } from '@tanstack/react-query'
import { getDepartments } from '@services/domain/departments.service'
import { departmentKeys } from '@services/query/keys/departmentKeys'
import { SearchableSelect } from '@shared/components/forms/SearchableSelect'
import { Button } from '@/components/ui/button'
import { ChevronsUpDown } from 'lucide-react'

interface DepartmentSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function DepartmentSelect({
  value,
  onChange,
  placeholder,
  disabled,
}: DepartmentSelectProps) {
  const { data, isLoading } = useQuery({
    queryKey: departmentKeys.departmentListFiltered({ pageSize: 100, sortField: 'name', sortDirection: 'asc' }),
    queryFn: () => getDepartments({ pageSize: 100, sortField: 'name', sortDirection: 'asc' }),
    staleTime: 5 * 60 * 1000,
  })

  const options = (data?.data ?? []).map((dept) => ({
    value: dept.id,
    label: dept.code ? `${dept.name} (${dept.code})` : dept.name,
  }))

  if (disabled) {
    const selectedOption = options.find((opt) => opt.value === value)
    return (
      <Button variant="outline" className="justify-between w-full opacity-60 cursor-not-allowed" disabled>
        {selectedOption?.label ?? placeholder ?? 'Select department...'}
        <ChevronsUpDown className="ml-2 size-4 text-foreground-muted" />
      </Button>
    )
  }

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder ?? 'Select department...'}
      isLoading={isLoading}
    />
  )
}
