import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StatusBadge from '@/components/shared/StatusBadge';

export default function ContractsWidget() {
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list('-created_date', 5)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Verträge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {contracts.map((contract) => (
            <Link key={contract.id} to={createPageUrl('ContractDetail') + `?id=${contract.id}`}>
              <div className="p-3 bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{contract.tenant_name || 'Unbekannt'}</div>
                    <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                      {contract.unit_name || contract.unit_id}
                    </div>
                  </div>
                  <StatusBadge status={contract.status || 'active'} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link to={createPageUrl('Contracts')} className="w-full">
          <Button variant="outline" className="w-full">
            Alle ansehen
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}