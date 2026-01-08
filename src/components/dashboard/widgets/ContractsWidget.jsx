import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { FileText } from 'lucide-react';

export default function ContractsWidget() {
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list('-created_date', 5)
  });

  return (
    <div className="space-y-2">
      {contracts.map((contract) => (
        <div key={contract.id} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-slate-50">
          <FileText className="w-4 h-4 text-green-600" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">Vertrag #{contract.id.slice(0, 8)}</div>
          </div>
          <Badge variant={contract.status === 'active' ? 'default' : 'secondary'} className="text-xs">
            {contract.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}