import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';

export default function ApprovalQueue() {
  const approvals = [
    { id: 1, title: 'Rechnung #1234', requester: 'Max M.', created_date: new Date(), status: 'pending' },
    { id: 2, title: 'Vertrag Änderung', requester: 'Anna S.', created_date: new Date(Date.now() - 7200000), status: 'pending' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Freigabe-Warteschlange
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {approvals.map((approval) => (
            <div key={approval.id} className="p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-sm">{approval.title}</div>
                  <div className="text-xs text-[var(--theme-text-muted)]">von {approval.requester}</div>
                </div>
                <TimeAgo date={approval.created_date} className="text-xs text-[var(--theme-text-muted)]" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Genehmigen
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <XCircle className="h-4 w-4 mr-1" />
                  Ablehnen
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}