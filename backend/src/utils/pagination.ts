import type { InfosPagination } from '../domain/types'

export function construirePagination(page: number, limit: number, total: number): InfosPagination {
  return {
    page,
    limit,
    total,
    total_pages: total === 0 ? 0 : Math.ceil(total / limit)
  }
}

export function calculerDecalage(page: number, limit: number): number {
  return (page - 1) * limit
}
