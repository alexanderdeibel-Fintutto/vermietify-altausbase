import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function PreciousMetalsList({ metals }) {
  if (!metals || metals.length === 0) {
    return <p className="text-slate-600 text-center py-8">Keine Edelmetalle hinzugefügt</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Art</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Gewicht</TableHead>
          <TableHead>Reinheit</TableHead>
          <TableHead>Lagerort</TableHead>
          <TableHead>Wert (EUR)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {metals.map((metal) => (
          <TableRow key={metal.id}>
            <TableCell>
              <Badge variant="secondary">{metal.metal_type}</Badge>
            </TableCell>
            <TableCell className="font-medium text-slate-900">{metal.name}</TableCell>
            <TableCell className="text-sm text-slate-600">
              {metal.weight_grams} g
            </TableCell>
            <TableCell className="text-sm text-slate-600">
              {metal.purity ? `${(metal.purity / 10).toFixed(1)}%` : '–'}
            </TableCell>
            <TableCell className="text-sm text-slate-600">{metal.storage_location}</TableCell>
            <TableCell className="font-medium">
              {metal.current_price_per_gram ? 
                `${((metal.current_price_per_gram || 0) * (metal.weight_grams || 0)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}` 
                : '–'
              }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}