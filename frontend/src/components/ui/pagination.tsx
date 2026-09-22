import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  limit?: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit = 20,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  // Always show pagination UI even if there is only 1 page or 0 results.
  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show first, last, current, and one around current
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4">
      {total !== undefined && (
        <div className="text-sm text-slate-500">
          Showing <span className="font-medium">{total === 0 ? 0 : (page - 1) * limit + 1}</span> to{' '}
          <span className="font-medium">
            {Math.min(page * limit, total)}
          </span>{' '}
          of <span className="font-medium">{total}</span> results
        </div>
      )}

      <div className="flex items-center gap-2 ml-auto">
        {onLimitChange && (
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-slate-500">Rows per page</span>
            <Select
              value={limit.toString()}
              onValueChange={(val) => onLimitChange(Number(val))}
            >
              <SelectTrigger className="w-[70px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handlePrevious}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, i) => (
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-slate-400">
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={page === p ? 'default' : 'outline'}
                size="sm"
                className={`h-8 w-8 p-0 ${
                  page === p 
                    ? 'bg-primary text-primary-foreground pointer-events-none' 
                    : 'text-slate-600'
                }`}
                onClick={() => typeof p === 'number' && onPageChange(p)}
              >
                {p}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleNext}
          disabled={page >= totalPages || totalPages === 0}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    </div>
  );
}
