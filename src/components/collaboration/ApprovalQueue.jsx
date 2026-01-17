import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ApprovalQueue({ items = [] }) {
  const mockItems = [
    { id: 1, title: 'BK-Abrechnung Objekt A', type: 'operating_cost', status: 'pending' },
    { id: 2, title: 'Mieterhöhung Wohnung 3B', type: 'rent_increase', status: 'pending' }
  ];

  const approvalItems = items.length > 0 ? items : mockItems;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Genehmigungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {approvalItems.map((item) => (
            <div key={item.id} className="p-4 bg-[var(--theme-surface)] rounded-lg">
              <div className="font-medium text-sm mb-2">{item.title}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2 text-[var(--vf-success-600)]" />
                  Genehmigen
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <XCircle className="h-4 w-4 mr-2 text-[var(--vf-error-600)]" />
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