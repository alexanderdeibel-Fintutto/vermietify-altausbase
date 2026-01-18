import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import StatusBadge from '@/components/shared/StatusBadge';

export default function DepositManager({ contractId }) {
  const deposit = {
    amount: 2400,
    status: 'deposited',
    account: 'Treuhandkonto DE89370400440532013000',
    date: '2024-01-15'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Kaution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--theme-text-secondary)]">Betrag</span>
            <CurrencyDisplay amount={deposit.amount} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--theme-text-secondary)]">Status</span>
            <StatusBadge status={deposit.status} />
          </div>
          <div className="p-3 bg-[var(--theme-surface)] rounded-lg">
            <div className="text-xs text-[var(--theme-text-muted)] mb-1">Konto</div>
            <div className="text-sm font-mono">{deposit.account}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}