import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Home, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function MarketPriceValuation({ buildingId }) {
  const { data: valuation } = useQuery({
    queryKey: ['valuation', buildingId],
    queryFn: async () => {
      const response = await base44.functions.invoke('valuateProperty', { building_id: buildingId });
      return response.data;
    },
    enabled: !!buildingId
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('valuateProperty', { building_id: buildingId, force_refresh: true });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Bewertung aktualisiert');
    }
  });

  if (!valuation) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          Marktpreis-Bewertung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-sm text-slate-600">Geschätzter Marktwert</p>
          <p className="text-3xl font-bold text-blue-900">{valuation.estimated_value.toLocaleString('de-DE')}€</p>
          <Badge className="mt-2">{valuation.confidence}% Konfidenz</Badge>
        </div>
        <Button variant="outline" onClick={() => refreshMutation.mutate()} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Aktualisieren
        </Button>
        <div className="text-xs text-slate-600">
          <p>• Vergleichswerte: {valuation.comparables_count}</p>
          <p>• Letzte Aktualisierung: {new Date(valuation.updated_at).toLocaleDateString('de-DE')}</p>
        </div>
      </CardContent>
    </Card>
  );
}