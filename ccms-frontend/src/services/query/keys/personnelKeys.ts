export const personnelKeys = {
  persons: () => ['persons'] as const,

  personList: () => [...personnelKeys.persons(), 'list'] as const,
  personListFiltered: (filters: Record<string, unknown>) =>
    [...personnelKeys.personList(), filters] as const,

  personDetail: () => [...personnelKeys.persons(), 'detail'] as const,
  person: (personId: string) => [...personnelKeys.personDetail(), personId] as const,

  personCases: (personId: string) =>
    [...personnelKeys.person(personId), 'cases'] as const,

  officers: () => ['officers'] as const,

  officerList: () => [...personnelKeys.officers(), 'list'] as const,
  officerListFiltered: (filters: Record<string, unknown>) =>
    [...personnelKeys.officerList(), filters] as const,

  officerDetail: () => [...personnelKeys.officers(), 'detail'] as const,
  officer: (officerId: string) =>
    [...personnelKeys.officerDetail(), officerId] as const,

  officerCases: (officerId: string) =>
    [...personnelKeys.officer(officerId), 'cases'] as const,
} as const
