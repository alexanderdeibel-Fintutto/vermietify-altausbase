import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingDown, Zap, AlertTriangle, CheckCircle2, Download } from 'lucide-react';

export default function TaxLossDashboard({ user }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [detailsOpen, setDetailsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: lossCarryforwards = [] } = useQuery({
    queryKey: ['lossCarryforwards', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.TaxLossCarryforward.filter(
        { user_id: user.id },
        '-year'
      ) || [];
    },
    enabled: !!user?.id
  });

  const { data: soldAssets = [] } = useQuery({
    queryKey: ['soldAssets', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.AssetPortfolio.filter(
        { user_id: user.id, status: 'sold' },
        '-updated_date'
      ) || [];
    },
    enabled: !!user?.id
  });

  const calculateLossesMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('calculateTaxLossCarryforward', {
        user_id: user.id,
        tax_year: selectedYear
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lossCarryforwards'] });
    }
  });

  const currentYearLoss = lossCarryforwards.find(l => l.year === selectedYear);
  const totalLosses = lossCarryforwards.reduce((sum, l) => sum + l.remaining_amount, 0);
  const utilizableAmount = currentYearLoss?.remaining_amount || 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-light text-slate-900">Verlustoptimierung</h1>
        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-light"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <Button
            onClick={() => calculateLossesMutation.mutate()}
            disabled={calculateLossesMutation.isPending}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <Zap className="h-4 w-4 mr-2" />
            Neu berechnen
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-light text-slate-600">Gesamtverluste (Alle Jahre)</div>
            <div className="text-2xl font-light text-red-600 mt-2">{formatCurrency(totalLosses)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-light text-slate-600">Verbrauchbar {selectedYear}</div>
            <div className="text-2xl font-light text-slate-900 mt-2">{formatCurrency(utilizableAmount)}</div>
            <div className="text-xs text-slate-500 mt-1">Vorjahrverluste</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-light text-slate-600">Verkaufte Positionen</div>
            <div className="text-2xl font-light text-slate-900 mt-2">{soldAssets.length}</div>
            <div className="text-xs text-slate-500 mt-1">in {selectedYear}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-light text-slate-600">Steuerersparnis</div>
            <div className="text-2xl font-light text-green-600 mt-2">
              {formatCurrency(utilizableAmount * 0.25)}
            </div>
            <div className="text-xs text-slate-500 mt-1">bei 25% Satz</div>
          </CardContent>
        </Card>
      </div>

      {/* Carryforward Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Verlustvorträge</CardTitle>
        </CardHeader>
        <CardContent>
          {lossCarryforwards.length === 0 ? (
            <p className="text-sm text-slate-600 font-light">Keine Verlustvorträge vorhanden</p>
          ) : (
            <div className="space-y-3">
              {lossCarryforwards.map(loss => (
                <div key={loss.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">{loss.year}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatCurrency(loss.loss_amount)} Verlust • {formatCurrency(loss.remaining_amount)} verbleibend
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={loss.remaining_amount > 0 ? 'default' : 'secondary'}>
                      {loss.remaining_amount > 0 ? 'Verfügbar' : 'Verbraucht'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sold Assets with Loss Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light">Verkaufte Positionen {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {soldAssets.length === 0 ? (
            <p className="text-sm text-slate-600 font-light">Keine verkauften Positionen in {selectedYear}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-2 font-light text-slate-600">Position</th>
                    <th className="text-right py-3 px-2 font-light text-slate-600">Kaufpreis</th>
                    <th className="text-right py-3 px-2 font-light text-slate-600">Verkaufspreis</th>
                    <th className="text-right py-3 px-2 font-light text-slate-600">Gewinn/Verlust</th>
                  </tr>
                </thead>
                <tbody>
                  {soldAssets.map(asset => {
                    const totalCost = asset.quantity * asset.purchase_price;
                    const totalRevenue = asset.quantity * asset.current_value;
                    const pl = totalRevenue - totalCost;
                    return (
                      <tr key={asset.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-2 font-light">{asset.name}</td>
                        <td className="text-right py-3 px-2 font-light">{formatCurrency(totalCost)}</td>
                        <td className="text-right py-3 px-2 font-light">{formatCurrency(totalRevenue)}</td>
                        <td className={`text-right py-3 px-2 font-medium ${pl < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(pl)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimization Tips */}
      {utilizableAmount > 0 && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertTitle>Optimierungsmöglichkeit</AlertTitle>
          <AlertDescription className="text-sm">
            Sie haben {formatCurrency(utilizableAmount)} Verlustvorträge für {selectedYear}. 
            Diese können verwendet werden, um Gewinne in diesem Jahr zu kompensieren.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}