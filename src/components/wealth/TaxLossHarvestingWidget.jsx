import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TaxLossHarvestingWidget({ userEmail }) {
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['tax_loss_harvesting', userEmail],
    queryFn: () => 
      base44.functions.invoke('analyzeTaxLossHarvesting', { user_email: userEmail }),
    select: (response) => response.data?.suggestions || [],
    enabled: !!userEmail,
  });

  if (isLoading) {
    return <Card><CardContent className="p-8 text-center text-slate-600">Wird geladen...</CardContent></Card>;
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Tax-Loss-Harvesting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">Keine Positionen mit Verlusten vorhanden</p>
        </CardContent>
      </Card>
    );
  }

  const totalSavings = suggestions.reduce((sum, s) => sum + s.tax_savings_estimate, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Tax-Loss-Harvesting
          </span>
          <Badge className="bg-green-100 text-green-800">
            {totalSavings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} Ersparnis
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.slice(0, 3).map((item) => (
          <div key={item.asset_id} className="border-b pb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-slate-900">{item.asset_name}</p>
                <p className="text-sm text-slate-600">{item.asset_class}</p>
              </div>
              <Badge variant={item.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                {item.priority}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-slate-600">Verlust</p>
                <p className="font-bold text-red-600">{item.unrealized_loss.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
              </div>
              <div>
                <p className="text-slate-600">Steuerersparnis</p>
                <p className="font-bold text-green-600">{item.tax_savings_estimate.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
              </div>
              <div>
                <p className="text-slate-600">Menge</p>
                <p className="font-bold">{item.current_quantity.toFixed(4)}</p>
              </div>
            </div>
            {item.wash_sale_warning && (
              <Alert className="mt-2 bg-yellow-50 border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 text-sm">
                  Wash-Sale-Warnung: Kürzlich verkauft
                </AlertDescription>
              </Alert>
            )}
          </div>
        ))}
        {suggestions.length > 3 && (
          <p className="text-sm text-slate-600 pt-2">
            +{suggestions.length - 3} weitere Positionen
          </p>
        )}
      </CardContent>
    </Card>
  );
}