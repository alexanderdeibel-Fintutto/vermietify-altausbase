import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, ArrowLeftRight } from 'lucide-react';

export default function PropertyComparison() {
  const [property1, setProperty1] = useState('');
  const [property2, setProperty2] = useState('');

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(null, 100)
  });

  const b1 = buildings.find(b => b.id === property1);
  const b2 = buildings.find(b => b.id === property2);

  const metrics = [
    { key: 'market_value', label: 'Marktwert' },
    { key: 'total_rent', label: 'Miete/Monat' },
    { key: 'units_count', label: 'Einheiten' },
    { key: 'construction_year', label: 'Baujahr' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Objektvergleich
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select value={property1} onValueChange={setProperty1}>
            <SelectTrigger>
              <SelectValue placeholder="Objekt 1" />
            </SelectTrigger>
            <SelectContent>
              {buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={property2} onValueChange={setProperty2}>
            <SelectTrigger>
              <SelectValue placeholder="Objekt 2" />
            </SelectTrigger>
            <SelectContent>
              {buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {b1 && b2 && (
          <div className="space-y-2">
            {metrics.map(m => (
              <div key={m.key} className="p-2 bg-slate-50 rounded">
                <p className="text-xs text-slate-600 mb-1">{m.label}</p>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-sm font-semibold">{b1[m.key] || '-'}</span>
                  <ArrowLeftRight className="w-4 h-4 text-slate-400 mx-auto" />
                  <span className="text-sm font-semibold text-right">{b2[m.key] || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}