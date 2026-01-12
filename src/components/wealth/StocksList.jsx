import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function StocksList({ stocks }) {
  if (!stocks || stocks.length === 0) {
    return <p className="text-slate-600 text-center py-8">Keine Aktien hinzugefügt</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>ISIN</TableHead>
          <TableHead>Typ</TableHead>
          <TableHead>Kurs</TableHead>
          <TableHead>Börse</TableHead>
          <TableHead>TER</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stocks.map((stock) => (
          <TableRow key={stock.id}>
            <TableCell>
              <div>
                <p className="font-medium text-slate-900">{stock.name}</p>
                <p className="text-xs text-slate-600">{stock.ticker}</p>
              </div>
            </TableCell>
            <TableCell className="text-sm text-slate-600">{stock.isin}</TableCell>
            <TableCell>
              <Badge variant="outline">{stock.type}</Badge>
            </TableCell>
            <TableCell className="text-sm font-medium">
              {stock.current_price ? `${stock.current_price.toFixed(2)} EUR` : '–'}
            </TableCell>
            <TableCell className="text-sm text-slate-600">{stock.exchange}</TableCell>
            <TableCell className="text-sm text-slate-600">
              {stock.ter ? `${stock.ter.toFixed(2)}%` : '–'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}