import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function MultiYearTaxStrategy() {
  const [country, setCountry] = useState('DE');
  const [startYear, setStartYear] = useState(CURRENT_YEAR);
  const [years, setYears] = useState(5);
  const [currentIncome, setCurrentIncome] = useState(100000);
  const [planning, setPlanning] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['multiYearStrategy', country, startYear, years, currentIncome],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateMultiYearTaxStrategy', {
        country,
        start_year: startYear,
        years,
        current_income: currentIncome
      });
      return response.data?.strategy || {};
    },
    enabled: planning
  });

  const chartData = (result.content?.annual_projections || []).map(p => ({
    year: p.year,
    tax: p.projected_tax,
    savings: p.potential_savings
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📈 Mehrjährige Steuerstrategie</h1>
        <p className="text-slate-500 mt-1">Planen Sie Ihre Steuern über mehrere Jahre</p>
      </div>

      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Planungsparameter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={planning}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
                  <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
                  <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Startjahr</label>
              <Select value={String(startYear)} onValueChange={(v) => setStartYear(parseInt(v))} disabled={planning}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Zeitraum (Jahre)</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={years}
                onChange={(e) => setYears(parseInt(e.target.value) || 1)}
                disabled={planning}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Aktuelles Einkommen (€)</label>
              <Input
                type="number"
                value={currentIncome}
                onChange={(e) => setCurrentIncome(parseInt(e.target.value) || 0)}
                disabled={planning}
              />
            </div>
          </div>

          <Button
            onClick={() => setPlanning(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={planning}
          >
            {planning ? '⏳ Wird geplant...' : 'Strategie erstellen'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Wird geplant...</div>
      ) : planning && result.content ? (
        <>
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Steuerprojektionen</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${Math.round(value).toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="tax" stroke="#ef4444" name="Geschätzte Steuer" />
                    <Line type="monotone" dataKey="savings" stroke="#10b981" name="Potential Einsparungen" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {result.content?.total_projected_savings && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Geschätzte Gesamteinsparungen</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  €{Math.round(result.content.total_projected_savings).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}

          {(result.content?.strategic_recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  💡 Strategische Empfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.strategic_recommendations.map((rec, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(result.content?.annual_actions || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Jährliche Aktionsschritte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.annual_actions.map((action, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded">
                    • {action}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">Geben Sie Parameter ein und klicken Sie "Strategie erstellen"</div>
      )}
    </div>
  );
}