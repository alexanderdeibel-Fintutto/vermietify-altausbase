import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContractRenewalTracker() {
  const { data: contracts = [] } = useQuery({
    queryKey: ['expiring-contracts'],
    queryFn: async () => {
      const all = await base44.entities.LeaseContract.filter({ status: 'active' });
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      
      return all.filter(c => {
        if (!c.end_date) return false;
        const endDate = new Date(c.end_date);
        return endDate <= threeMonthsFromNow;
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Auslaufende Verträge
          {contracts.length > 0 && (
            <span className="vf-badge vf-badge-warning">{contracts.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contracts.length > 0 ? (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <div key={contract.id} className="p-3 bg-[var(--vf-warning-50)] rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-[var(--vf-warning-600)] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{contract.tenant_name || 'Unbekannt'}</div>
                    <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                      Endet am {new Date(contract.end_date).toLocaleDateString('de-DE')}
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      Verlängerung anbieten
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-[var(--theme-text-muted)]">
            Keine auslaufenden Verträge in den nächsten 3 Monaten
          </div>
        )}
      </CardContent>
    </Card>
  );
}