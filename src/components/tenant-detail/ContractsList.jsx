import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SortAsc, Filter } from 'lucide-react';

export default function ContractsList({ contracts }) {
  const [sortBy, setSortBy] = useState('recent');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredContracts = useMemo(() => {
    let filtered = contracts.filter(c => 
      statusFilter === 'all' || (c.status || 'active') === statusFilter
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.start_date) - new Date(a.start_date);
        case 'oldest':
          return new Date(a.start_date) - new Date(b.start_date);
        case 'expiring':
          return new Date(a.end_date) - new Date(b.end_date);
        default:
          return 0;
      }
    });

    return filtered;
  }, [contracts, sortBy, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              Alle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>
              Aktiv
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('ended')}>
              Beendet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SortAsc className="w-4 h-4" />
              Sortieren
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortBy('recent')}>
              Neueste zuerst
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('oldest')}>
              Älteste zuerst
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('expiring')}>
              Bald ablaufend
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-500 text-sm">Keine Verträge gefunden</p>
          </CardContent>
        </Card>
      ) : (
        filteredContracts.map(contract => (
          <Card key={contract.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {contract.contract_number || 'Vertrag ohne Nummer'}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {contract.unit_name && `Einheit: ${contract.unit_name}`}
                  </p>
                </div>
                <Badge 
                  variant={contract.status === 'active' ? 'default' : 'outline'}
                  className={contract.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                >
                  {contract.status === 'active' ? 'Aktiv' : 'Beendet'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-600">Beginn</p>
                  <p className="font-medium text-slate-900">
                    {contract.start_date ? new Date(contract.start_date).toLocaleDateString('de-DE') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Ende</p>
                  <p className="font-medium text-slate-900">
                    {contract.end_date ? new Date(contract.end_date).toLocaleDateString('de-DE') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Miete/Monat</p>
                  <p className="font-medium text-slate-900">
                    €{(contract.rent_amount || 0).toLocaleString('de-DE')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}