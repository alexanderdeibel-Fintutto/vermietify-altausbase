import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Badge } from 'lucide-react';

export default function ContractsWidget() {
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-widget'],
    queryFn: () => base44.entities.LeaseContract.filter({ status: 'active' }, '-updated_date', 20)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Aktive Verträge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <p className="text-4xl font-bold text-slate-900">{contracts.length}</p>
          <p className="text-sm text-slate-600 mt-1">Mietverträge</p>
        </div>
      </CardContent>
    </Card>
  );
}