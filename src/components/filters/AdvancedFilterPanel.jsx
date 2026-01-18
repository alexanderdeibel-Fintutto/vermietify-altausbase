import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

export default function AdvancedFilterPanel({ onFilter, onReset }) {
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    category: ''
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Erweiterte Filter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <VfSelect
            label="Status"
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
            options={[
              { value: '', label: 'Alle' },
              { value: 'active', label: 'Aktiv' },
              { value: 'inactive', label: 'Inaktiv' }
            ]}
          />

          <VfSelect
            label="Kategorie"
            value={filters.category}
            onChange={(v) => setFilters({ ...filters, category: v })}
            options={[
              { value: '', label: 'Alle' },
              { value: 'residential', label: 'Wohnimmobilie' },
              { value: 'commercial', label: 'Gewerbe' }
            ]}
          />

          <VfDatePicker
            label="Von Datum"
            value={filters.dateFrom}
            onChange={(v) => setFilters({ ...filters, dateFrom: v })}
          />

          <VfDatePicker
            label="Bis Datum"
            value={filters.dateTo}
            onChange={(v) => setFilters({ ...filters, dateTo: v })}
          />

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onReset} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
            <Button variant="gradient" onClick={() => onFilter(filters)} className="flex-1">
              Anwenden
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}