import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function CryptoList({ cryptos }) {
  if (!cryptos || cryptos.length === 0) {
    return <p className="text-slate-600 text-center py-8">Keine Kryptowährungen hinzugefügt</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Symbol</TableHead>
          <TableHead>Blockchain</TableHead>
          <TableHead>Kurs (EUR)</TableHead>
          <TableHead>Lagerort</TableHead>
          <TableHead>Staking</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cryptos.map((crypto) => (
          <TableRow key={crypto.id}>
            <TableCell>
              <p className="font-medium text-slate-900">{crypto.name}</p>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{crypto.symbol}</Badge>
            </TableCell>
            <TableCell className="text-sm text-slate-600">{crypto.blockchain}</TableCell>
            <TableCell className="text-sm font-medium">
              {crypto.current_price_eur ? `${crypto.current_price_eur.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}` : '–'}
            </TableCell>
            <TableCell className="text-sm text-slate-600">{crypto.wallet_type}</TableCell>
            <TableCell>
              {crypto.is_staking ? (
                <Badge className="bg-green-100 text-green-800">{crypto.staking_apy}% APY</Badge>
              ) : (
                <span className="text-sm text-slate-600">–</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}