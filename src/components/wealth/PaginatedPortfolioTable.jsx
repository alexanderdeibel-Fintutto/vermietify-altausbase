import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AssetPortfolioTable from './AssetPortfolioTable';

export default function PaginatedPortfolioTable({ portfolio, onEdit, onDelete }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const paginatedData = useMemo(() => {
    const startIdx = (page - 1) * pageSize;
    return portfolio.slice(startIdx, startIdx + pageSize);
  }, [portfolio, page, pageSize]);

  const totalPages = Math.ceil(portfolio.length / pageSize);

  return (
    <div className="space-y-4">
      <AssetPortfolioTable portfolio={paginatedData} onEdit={onEdit} onDelete={onDelete} />
      
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
        <div className="flex items-center gap-4">
          <span className="text-sm font-light text-slate-600">
            {portfolio.length} Positionen • Seite {page} von {totalPages}
          </span>
          <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setPage(1); }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 pro Seite</SelectItem>
              <SelectItem value="25">25 pro Seite</SelectItem>
              <SelectItem value="50">50 pro Seite</SelectItem>
              <SelectItem value="100">100 pro Seite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}