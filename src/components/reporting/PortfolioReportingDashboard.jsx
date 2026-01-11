import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, TrendingUp, Building2, Users } from 'lucide-react';

export default function PortfolioReportingDashboard({ companyId }) {
  const queryClient = useQueryClient();

  const { data: metrics = [] } = useQuery({
    queryKey: ['portfolio-metrics', companyId],
    queryFn: () => base44.asServiceRole.entities.PortfolioMetrics.filter({ company_id: companyId }, '-reporting_period', 6)
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('generatePortfolioReport', { company_id: companyId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio-metrics'] })
  });

  const latestMetrics = metrics[0];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Portfolio-Reporting
            </CardTitle>
            <Button
              size="sm"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              Bericht generieren
            </Button>
          </div>
        </CardHeader>
        {latestMetrics && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-600">Einheiten</span>
                </div>
                <p className="text-2xl font-bold">{latestMetrics.total_units}</p>
                <p className="text-xs text-slate-600">{latestMetrics.occupied_units} vermietet</p>
              </div>

              <div className="p-3 bg-green-50 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600">Ø ROI</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{latestMetrics.avg_roi}%</p>
              </div>

              <div className="p-3 bg-yellow-50 rounded">
                <span className="text-xs text-yellow-600">Leerstand</span>
                <p className="text-2xl font-bold text-yellow-900">{latestMetrics.vacancy_rate}%</p>
              </div>

              <div className="p-3 bg-purple-50 rounded">
                <span className="text-xs text-purple-600">EK-Quote</span>
                <p className="text-2xl font-bold text-purple-900">{latestMetrics.equity_ratio}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded">
                <p className="text-xs text-slate-600 mb-1">Mieteinnahmen/Jahr</p>
                <p className="text-lg font-bold">{latestMetrics.total_rental_income?.toLocaleString()}€</p>
              </div>
              <div className="p-3 border rounded">
                <p className="text-xs text-slate-600 mb-1">NOI</p>
                <p className="text-lg font-bold text-green-600">{latestMetrics.net_operating_income?.toLocaleString()}€</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-600 mb-1">Portfolio-Wert</p>
              <p className="text-xl font-bold">{latestMetrics.portfolio_value?.toLocaleString()}€</p>
              <p className="text-xs text-slate-600 mt-1">Schulden: {latestMetrics.total_debt?.toLocaleString()}€</p>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-3">
        {metrics.slice(1, 4).map(m => (
          <Card key={m.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">{m.reporting_period}</span>
                <div className="flex gap-3 text-xs">
                  <span>ROI: {m.avg_roi}%</span>
                  <span>Leerstand: {m.vacancy_rate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}