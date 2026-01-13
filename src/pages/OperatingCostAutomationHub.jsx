import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

export default function OperatingCostAutomationHub() {
  const queryClient = useQueryClient();

  const { data: automations = [] } = useQuery({
    queryKey: ['operating-cost-automation'],
    queryFn: () => base44.entities.OperatingCostAutomation.list()
  });

  const runMutation = useMutation({
    mutationFn: async (automationId) => {
      return await base44.entities.OperatingCostAutomation.update(automationId, { 
        last_run: new Date().toISOString(),
        next_run: new Date(Date.now() + 30*24*60*60*1000).toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operating-cost-automation'] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Betriebskosten-Automation</h1>
          <p className="text-slate-600">Automatisierte & fehlerfreie Abrechnungen</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {automations.map(auto => (
          <Card key={auto.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold">Gebäude {auto.building_id}</p>
                  <p className="text-sm text-slate-600 capitalize">{auto.allocation_method.replace('_', ' ')}</p>
                </div>
                <Badge className={auto.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100'}>
                  {auto.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <p className="text-slate-600">Genauigkeit</p>
                  <p className="font-bold">{auto.accuracy_rate}%</p>
                </div>
                <div>
                  <p className="text-slate-600">Kategorien</p>
                  <p className="font-bold">{JSON.parse(auto.cost_categories || '[]').length}</p>
                </div>
                <div>
                  <p className="text-slate-600">Letzte Ausführung</p>
                  <p className="font-bold text-xs">
                    {auto.last_run ? new Date(auto.last_run).toLocaleDateString('de-DE') : 'Nie'}
                  </p>
                </div>
              </div>

              <Button 
                onClick={() => runMutation.mutate(auto.id)}
                disabled={runMutation.isPending}
                size="sm"
              >
                Jetzt ausführen
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}