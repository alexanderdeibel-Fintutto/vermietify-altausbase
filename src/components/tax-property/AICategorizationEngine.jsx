import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AICategorizationEngine() {
  const queryClient = useQueryClient();

  const { data: uncategorized = [] } = useQuery({
    queryKey: ['uncategorizedItems'],
    queryFn: () => base44.entities.FinancialItem.filter(
      { category: { $exists: false } },
      '-date',
      50
    )
  });

  const categorizeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('autoClassifyTransactions', {
        limit: 50
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['uncategorizedItems'] });
      queryClient.invalidateQueries({ queryKey: ['financialItems'] });
      toast.success(`${data.categorized} Positionen kategorisiert`);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          KI Auto-Kategorisierung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-900">Unkategorisiert</p>
          <p className="text-3xl font-bold text-orange-900">{uncategorized.length}</p>
        </div>

        <Button
          onClick={() => categorizeMutation.mutate()}
          disabled={categorizeMutation.isPending || uncategorized.length === 0}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
        >
          <Zap className="w-4 h-4 mr-2" />
          {categorizeMutation.isPending ? 'KI kategorisiert...' : 'Automatisch kategorisieren'}
        </Button>

        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-900 mb-2">KI lernt von Ihren Korrekturen:</p>
          <ul className="space-y-1 text-xs text-slate-600">
            <li>• Erkennt wiederkehrende Muster</li>
            <li>• Vorschläge werden präziser</li>
            <li>• 95%+ Genauigkeit nach 100 Buchungen</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}