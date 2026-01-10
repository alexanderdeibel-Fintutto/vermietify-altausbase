import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-600', label: 'Ausstehend' },
  signed: { icon: CheckCircle2, color: 'text-green-600', label: 'Signiert' },
  rejected: { icon: AlertCircle, color: 'text-red-600', label: 'Abgelehnt' }
};

export default function SignatureStatusTracker({ documentId }) {
  const [expandedRequests, setExpandedRequests] = useState({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['signature-requests', documentId],
    queryFn: async () => {
      const allRequests = await base44.entities.SignatureRequest.filter({
        document_id: documentId
      });
      return allRequests.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  if (isLoading) return <div className="animate-pulse h-24 bg-slate-200 rounded-lg" />;

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p className="text-sm">Keine Signaturanfragen für dieses Dokument</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map(request => {
        const isExpanded = expandedRequests[request.id];
        const signedCount = request.signers.filter(s => s.status === 'signed').length;
        const totalCount = request.signers.length;
        const progress = (signedCount / totalCount) * 100;

        return (
          <Card key={request.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    Signaturanfrage #{request.id.slice(0, 8)}
                    <Badge className={`ml-auto ${
                      request.status === 'completed' ? 'bg-green-100 text-green-700' :
                      request.status === 'cancelled' ? 'bg-slate-100 text-slate-700' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {request.status}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-slate-600 mt-1">
                    Von {request.initiator_name} am {format(new Date(request.created_date), 'dd. MMM yyyy HH:mm', { locale: de })}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedRequests({
                    ...expandedRequests,
                    [request.id]: !isExpanded
                  })}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </CardHeader>

            {/* Progress Bar */}
            <div className="px-6 py-2 border-t border-b bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-slate-700">
                  {signedCount} von {totalCount} signiert
                </p>
                <span className="text-xs text-slate-600">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {isExpanded && (
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {request.signers.map((signer, idx) => {
                    const config = statusConfig[signer.status];
                    const Icon = config.icon;

                    return (
                      <div key={idx} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
                        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{signer.name}</p>
                          <p className="text-xs text-slate-600">{signer.email}</p>
                          {signer.role && (
                            <p className="text-xs text-slate-500 mt-1">{signer.role}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                          {signer.signed_at && (
                            <p className="text-xs text-slate-600 mt-1">
                              {format(new Date(signer.signed_at), 'dd.MM.yyyy', { locale: de })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Audit Trail */}
                  {request.audit_trail && request.audit_trail.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-medium text-slate-700 mb-2">Audit Trail</p>
                      <div className="space-y-1">
                        {request.audit_trail.map((entry, idx) => (
                          <p key={idx} className="text-xs text-slate-600">
                            <span className="font-medium">{entry.action}</span> von {entry.actor} am{' '}
                            {format(new Date(entry.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                            {entry.details && ` - ${entry.details}`}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}