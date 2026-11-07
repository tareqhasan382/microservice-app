import { Button } from './Button'
import { IconChevronLeft, IconChevronRight } from '../icons'

export interface PaginationProps {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, limit, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="pagination">
      <span className="muted pagination__meta">
        Showing {from}–{to} of {total}
      </span>
      <div className="pagination__pages">
        <Button
          size="sm"
          variant="ghost"
          iconOnly
          icon={<IconChevronLeft width={16} height={16} />}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        />
        <span className="muted pagination__page">
          Page {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="ghost"
          iconOnly
          icon={<IconChevronRight width={16} height={16} />}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        />
      </div>
    </div>
  )
}
