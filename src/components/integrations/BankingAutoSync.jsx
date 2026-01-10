import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function BankingAutoSync() {
  const [autoSync, setAutoSync] = React.useState(true);

  const toggleMutation = useMutation({
    mutationFn: async (enabled) => {
      await base44.functions.invoke('toggleAutoSync', { enabled });
    },
    onSuccess: () => {
      toast.success('Auto-Sync aktualisiert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Banking Auto-Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Automatische Synchronisation</span>
          <Switch
            checked={autoSync}
            onCheckedChange={(checked) => {
              setAutoSync(checked);
              toggleMutation.mutate(checked);
            }}
          />
        </div>
        <Badge className="bg-green-600">Alle 4 Stunden</Badge>
        <p className="text-xs text-slate-600">
          Transaktionen werden automatisch importiert und kategorisiert
        </p>
      </CardContent>
    </Card>
  );
}