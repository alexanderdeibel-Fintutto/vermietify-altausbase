import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Search, Filter, SortAsc } from 'lucide-react';

export default function TenantFilterBar({
  onSearchChange,
  onStatusChange,
  onPortalAccessChange,
  onSortChange,
  onNewTenant,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Nach Name oder Email suchen..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex gap-2">
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onStatusChange?.('all')}>
              Alle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange?.('active')}>
              Aktiv
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange?.('inactive')}>
              Inaktiv
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onPortalAccessChange?.('with_access')}>
              Mit Portal-Zugang
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPortalAccessChange?.('without_access')}>
              Ohne Portal-Zugang
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SortAsc className="w-4 h-4" />
              Sortieren
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSortChange?.('name_asc')}>
              Name (A-Z)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange?.('name_desc')}>
              Name (Z-A)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSortChange?.('created_recent')}>
              Neueste zuerst
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange?.('created_oldest')}>
              Älteste zuerst
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={onNewTenant}
          className="bg-slate-700 hover:bg-slate-800 gap-2"
          size="sm"
        >
          + Neuer Mieter
        </Button>
      </div>
    </div>
  );
}