import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText } from 'lucide-react';

export default function ContractOverview() {
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list(null, 100)
  });

  const activeContracts = contracts.filter(c => c.status === 'active');
  const expiringSoon = activeContracts.filter(c => {
    if (!c.end_date || c.is_unlimited) return false;
    const days = Math.floor((new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 60;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Vertragslaufzeiten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-green-50 rounded text-center">
            <p className="text-xs text-green-900">Aktiv</p>
            <p className="text-2xl font-bold text-green-900">{activeContracts.length}</p>
          </div>
          <div className="p-2 bg-orange-50 rounded text-center">
            <p className="text-xs text-orange-900">Bald fällig</p>
            <p className="text-2xl font-bold text-orange-900">{expiringSoon.length}</p>
          </div>
        </div>

        {expiringSoon.slice(0, 3).map(contract => {
          const days = Math.floor((new Date(contract.end_date) - new Date()) / (1000 * 60 * 60 * 24));
          const progress = ((90 - days) / 90) * 100;
          
          return (
            <div key={contract.id} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Vertrag #{contract.id?.slice(0, 8)}</span>
                <span className="font-semibold">{days} Tage</span>
              </div>
              <Progress value={progress} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}