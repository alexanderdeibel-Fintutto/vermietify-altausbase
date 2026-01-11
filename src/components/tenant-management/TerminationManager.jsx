import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Send, Calendar } from 'lucide-react';

export default function TerminationManager({ companyId }) {
  const queryClient = useQueryClient();

  const { data: terminations = [] } = useQuery({
    queryKey: ['terminations', companyId],
    queryFn: () => base44.asServiceRole.entities.Termination.filter({ company_id: companyId })
  });

  const processMutation = useMutation({
    mutationFn: ({ terminationId, action }) =>
      base44.functions.invoke('processTermination', { termination_id: terminationId, action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['terminations'] })
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'notice_given': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'successor_found': return 'bg-purple-100 text-purple-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          Kündigungsmanagement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {terminations.map(term => (
          <div key={term.id} className="p-3 border rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {term.initiated_by === 'tenant' ? 'Mieter' : 'Vermieter'}-Kündigung
              </span>
              <Badge className={getStatusColor(term.status)}>
                {term.status}
              </Badge>
            </div>

            <div className="text-xs space-y-1 mb-2">
              <p>Kündigungsdatum: {term.termination_date}</p>
              <p>Frist: {term.notice_period_months} Monate</p>
              {term.move_out_date && <p>Auszug: {term.move_out_date}</p>}
            </div>

            <div className="flex gap-2">
              {term.status === 'notice_given' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => processMutation.mutate({ terminationId: term.id, action: 'calculate_dates' })}
                    className="flex-1 gap-1"
                  >
                    <Calendar className="w-3 h-3" />
                    Fristen
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => processMutation.mutate({ terminationId: term.id, action: 'send_confirmation' })}
                    className="flex-1 gap-1"
                  >
                    <Send className="w-3 h-3" />
                    Bestätigen
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}