import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function BudgetRequestStatus() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['budgetRequests'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return await base44.entities.BudgetRequest.filter(
          { requester_email: user.email },
          '-created_at',
          10
        );
      } catch {
        return [];
      }
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'submitted':
      case 'draft':
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-slate-100 text-slate-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800'
    };
    return badges[status] || 'bg-slate-100 text-slate-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card className="bg-slate-50">
        <CardContent className="pt-4 text-center">
          <p className="text-sm text-slate-600">Keine Budgetanfragen</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Card key={request.id} className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(request.status)}
                <div className="flex-1">
                  <p className="font-semibold text-sm">{request.request_title}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Kategorie: {request.category}
                  </p>
                </div>
              </div>
              <Badge className={getStatusBadge(request.status)}>
                {request.status === 'draft' && 'Entwurf'}
                {request.status === 'submitted' && 'Eingereicht'}
                {request.status === 'approved' && 'Genehmigt'}
                {request.status === 'rejected' && 'Abgelehnt'}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
              <p>Betrag: <span className="font-semibold text-slate-900">{request.requested_amount.toLocaleString('de-DE')} €</span></p>
              <p>Erstellt: {new Date(request.created_at).toLocaleDateString('de-DE')}</p>
              {request.submitted_at && (
                <p>Eingereicht: {new Date(request.submitted_at).toLocaleDateString('de-DE')}</p>
              )}
            </div>

            {request.justification && (
              <p className="text-xs text-slate-700 mt-2 italic">"{request.justification}"</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}