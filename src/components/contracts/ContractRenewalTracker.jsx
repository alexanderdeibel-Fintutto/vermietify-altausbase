import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, AlertCircle } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';

export default function ContractRenewalTracker() {
  const { data: contracts = [] } = useQuery({
    queryKey: ['expiring-contracts'],
    queryFn: async () => {
      const all = await base44.entities.LeaseContract.list();
      return all.filter(c => {
        if (!c.ende_datum || c.status !== 'Aktiv') return false;
        const end = new Date(c.ende_datum);
        const now = new Date();
        const daysUntil = (end - now) / (1000 * 60 * 60 * 24);
        return daysUntil > 0 && daysUntil <= 90;
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
        <div className="space-y-3">
          {contracts.length === 0 ? (
            <div className="text-center py-4 text-[var(--theme-text-muted)]">
              Keine auslaufenden Verträge
            </div>
          ) : (
            contracts.map((contract) => (
              <div key={contract.id} className="p-3 bg-[var(--vf-warning-50)] border border-[var(--vf-warning-200)] rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-[var(--vf-warning-600)] mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Vertrag #{contract.id}</div>
                    <div className="text-xs text-[var(--theme-text-secondary)]">
                      Endet {new Date(contract.ende_datum).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Verlängern
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}