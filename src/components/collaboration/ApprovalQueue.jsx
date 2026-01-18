import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ApprovalQueue() {
  const { data: approvals = [] } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => base44.entities.Approval.filter({ status: 'pending' })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Freigaben
          {approvals.length > 0 && (
            <span className="vf-badge vf-badge-warning">{approvals.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {approvals.length === 0 ? (
            <div className="text-center py-8 text-[var(--theme-text-muted)]">
              Keine ausstehenden Freigaben
            </div>
          ) : (
            approvals.map((approval) => (
              <div key={approval.id} className="p-3 bg-[var(--theme-surface)] rounded-lg">
                <div className="font-medium text-sm mb-2">{approval.title}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Genehmigen
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <XCircle className="h-4 w-4 mr-2" />
                    Ablehnen
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}