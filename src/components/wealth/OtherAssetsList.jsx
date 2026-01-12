import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function OtherAssetsList({ otherAssets }) {
  if (!otherAssets || otherAssets.length === 0) {
    return <p className="text-slate-600 text-center py-8">Keine sonstigen Vermögenswerte hinzugefügt</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Typ</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Erwerbsdatum</TableHead>
          <TableHead>Aktueller Wert</TableHead>
          <TableHead>Steuerbehandlung</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {otherAssets.map((asset) => (
          <TableRow key={asset.id}>
            <TableCell>
              <Badge variant="outline">{asset.asset_type}</Badge>
            </TableCell>
            <TableCell className="font-medium text-slate-900">{asset.name}</TableCell>
            <TableCell className="text-sm text-slate-600">
              {asset.acquisition_date || '–'}
            </TableCell>
            <TableCell className="font-medium">
              {asset.current_value ? 
                asset.current_value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                : '–'
              }
            </TableCell>
            <TableCell className="text-sm">{asset.tax_treatment}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}