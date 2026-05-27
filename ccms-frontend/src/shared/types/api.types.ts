export interface ApiMessageResponse {
  message: string
}

export interface ApiDetailResponse<T> {
  data: T
}

export interface ApiListResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

