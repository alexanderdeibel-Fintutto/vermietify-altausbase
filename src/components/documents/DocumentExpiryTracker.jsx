import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function DocumentExpiryTracker({ companyId }) {
  const [docId, setDocId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const queryClient = useQueryClient();

  const { data: expiries = [] } = useQuery({
    queryKey: ['document-expiries', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.DocumentExpiry.filter({ company_id: companyId });
      return result;
    }
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.asServiceRole.entities.DocumentExpiry.create({
        document_id: docId,
        company_id: companyId,
        expiry_date: expiryDate,
        reminder_days: [30, 14, 7, 1],
        status: 'active'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-expiries'] });
      setDocId('');
      setExpiryDate('');
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'expiring_soon': return 'bg-orange-100 text-orange-700';
      case 'expired': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Ablauf-Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Dokument-ID"
            value={docId}
            onChange={(e) => setDocId(e.target.value)}
            className="text-sm"
          />
          <Input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="text-sm"
          />
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!docId || !expiryDate || createMutation.isPending}
            className="w-full"
          >
            Ablauf hinzufügen
          </Button>
        </CardContent>
      </Card>

      {/* Expiries List */}
      <div className="space-y-2">
        {expiries.map(exp => {
          const daysLeft = differenceInDays(new Date(exp.expiry_date), new Date());
          return (
            <Card key={exp.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Dokument: {exp.document_id}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Läuft ab: {format(new Date(exp.expiry_date), 'dd.MM.yyyy')}
                    </p>
                    <p className="text-xs text-slate-700 font-medium mt-1">
                      {daysLeft >= 0 ? `${daysLeft} Tage verbleibend` : `${Math.abs(daysLeft)} Tage überfällig`}
                    </p>
                  </div>
                  <Badge className={getStatusColor(exp.status)}>
                    {exp.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}