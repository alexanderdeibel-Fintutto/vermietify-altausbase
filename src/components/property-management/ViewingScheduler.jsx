import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check } from 'lucide-react';

export default function ViewingScheduler({ companyId }) {
  const [applicantId, setApplicantId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [dateTime, setDateTime] = useState('');
  const queryClient = useQueryClient();

  const { data: viewings = [] } = useQuery({
    queryKey: ['viewings', companyId],
    queryFn: () => base44.asServiceRole.entities.Viewing.filter({ company_id: companyId })
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.asServiceRole.entities.Viewing.create({
        unit_id: unitId,
        applicant_id: applicantId,
        company_id: companyId,
        viewing_date: dateTime,
        status: 'scheduled'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viewings'] });
      setApplicantId('');
      setUnitId('');
      setDateTime('');
    }
  });

  const confirmMutation = useMutation({
    mutationFn: (viewingId) =>
      base44.functions.invoke('manageViewing', { viewing_id: viewingId, action: 'send_confirmation' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viewings'] })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Besichtigungstermine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Einheits-ID"
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          className="text-sm"
        />
        <Input
          placeholder="Bewerber-ID"
          value={applicantId}
          onChange={(e) => setApplicantId(e.target.value)}
          className="text-sm"
        />
        <Input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="text-sm"
        />
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!unitId || !applicantId || !dateTime || createMutation.isPending}
          className="w-full"
        >
          Termin erstellen
        </Button>

        <div className="space-y-2 pt-3 border-t">
          {viewings.slice(0, 5).map(view => (
            <div key={view.id} className="p-2 border rounded text-xs">
              <div className="flex items-center justify-between mb-1">
                <span>{new Date(view.viewing_date).toLocaleString('de-DE')}</span>
                <Badge variant="outline">{view.status}</Badge>
              </div>
              {view.status === 'scheduled' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => confirmMutation.mutate(view.id)}
                  className="w-full gap-1 mt-2"
                >
                  <Check className="w-3 h-3" />
                  Bestätigen
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}