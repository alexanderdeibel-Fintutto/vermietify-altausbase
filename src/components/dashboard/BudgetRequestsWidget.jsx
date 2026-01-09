import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle } from 'lucide-react';
import BudgetRequestForm from '@/components/budget/BudgetRequestForm';

export default function BudgetRequestsWidget({ onRefresh }) {
  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['userBudgetRequests'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return await base44.entities.BudgetRequest.filter(
          { requester_email: user.email },
          '-created_at',
          5
        );
      } catch {
        return [];
      }
    }
  });

  const statuses = {
    draft: { label: 'Entwurf', color: 'bg-slate-100 text-slate-800' },
    submitted: { label: 'Eingereicht', color: 'bg-blue-100 text-blue-800' },
    approved: { label: 'Genehmigt', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Abgelehnt', color: 'bg-red-100 text-red-800' }
  };

  const totalRequested = requests?.reduce((sum, r) => sum + (r.requested_amount || 0), 0) || 0;
  const pendingCount = requests?.filter(r => r.status === 'submitted').length || 0;
  const approvedCount = requests?.filter(r => r.status === 'approved').length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            Budgetanfragen
          </CardTitle>
          <BudgetRequestForm onSuccess={() => refetch()} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-blue-50 p-2 rounded border border-blue-200">
            <p className="text-blue-600">Ausstehend</p>
            <p className="font-semibold text-blue-900">{pendingCount}</p>
          </div>
          <div className="bg-green-50 p-2 rounded border border-green-200">
            <p className="text-green-600">Genehmigt</p>
            <p className="font-semibold text-green-900">{approvedCount}</p>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <p className="text-slate-600">Summe</p>
            <p className="font-semibold text-slate-900">{totalRequested.toLocaleString('de-DE')} €</p>
          </div>
        </div>

        {/* Recent Requests */}
        {requests && requests.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {requests.slice(0, 3).map((request) => (
              <div key={request.id} className="bg-slate-50 p-2 rounded text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold truncate">{request.request_title}</span>
                  <Badge className={statuses[request.status].color}>
                    {statuses[request.status].label}
                  </Badge>
                </div>
                <p className="text-slate-600">{request.requested_amount.toLocaleString('de-DE')} € • {request.category}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-600 text-center py-4">Keine Anfragen vorhanden</p>
        )}
      </CardContent>
    </Card>
  );
}