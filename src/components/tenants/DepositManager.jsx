import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Shield, CheckCircle } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function DepositManager({ contract }) {
  const deposit = contract?.deposit_amount || 0;
  const status = contract?.deposit_status || 'pending';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Kaution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center p-4 bg-[var(--theme-surface)] rounded-lg">
            <CurrencyDisplay amount={deposit} className="text-2xl font-bold" />
            <div className="text-xs text-[var(--theme-text-muted)] mt-1">Kautionsbetrag</div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-[var(--vf-success-50)] rounded-lg">
            <CheckCircle className="h-5 w-5 text-[var(--vf-success-600)]" />
            <span className="text-sm font-medium text-[var(--vf-success-700)]">
              Kaution hinterlegt
            </span>
          </div>

          <div className="text-xs text-[var(--theme-text-muted)]">
            Hinterlegt am: {contract?.deposit_date ? new Date(contract.deposit_date).toLocaleDateString('de-DE') : '-'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}