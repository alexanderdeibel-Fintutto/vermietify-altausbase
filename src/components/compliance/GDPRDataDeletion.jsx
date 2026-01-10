import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trash, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function GDPRDataDeletion() {
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('requestGDPRDeletion', {});
    },
    onSuccess: () => {
      toast.success('Löschantrag eingereicht');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash className="w-5 h-5" />
          DSGVO-Datenlöschung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-xs text-slate-600">
              Diese Aktion löscht alle Ihre persönlichen Daten unwiderruflich gemäß DSGVO Art. 17
            </p>
          </div>
        </div>
        <Button variant="destructive" onClick={() => deleteMutation.mutate()} className="w-full">
          Datenlöschung beantragen
        </Button>
      </CardContent>
    </Card>
  );
}