import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ElsterDirectSubmit() {
  const { data: submissions = [] } = useQuery({
    queryKey: ['elsterSubmissions'],
    queryFn: () => base44.entities.ElsterSubmission.list('-created_date', 10)
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('submitToElster', {
        year: new Date().getFullYear(),
        forms: ['ESt1A', 'AnlageV', 'AnlageKAP']
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('An ELSTER übermittelt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          ELSTER-Übermittlung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending}
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700"
        >
          <Send className="w-5 h-5 mr-2" />
          {submitMutation.isPending ? 'Übermittle...' : 'Jetzt an ELSTER senden'}
        </Button>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Letzte Übermittlungen:</p>
          {submissions.slice(0, 3).map(sub => (
            <div key={sub.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm">{sub.form_type} {sub.tax_year}</span>
              <Badge className={
                sub.status === 'submitted' ? 'bg-green-600' :
                sub.status === 'pending' ? 'bg-orange-600' :
                'bg-slate-600'
              }>
                {sub.status === 'submitted' && <CheckCircle className="w-3 h-3 mr-1" />}
                {sub.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}