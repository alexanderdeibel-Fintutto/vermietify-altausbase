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
import { Briefcase, TrendingUp } from 'lucide-react';

export default function SelfEmploymentTaxPlanner() {
  const [country, setCountry] = useState('DE');
  const [businessRevenue, setBusinessRevenue] = useState(150000);
  const [expenses, setExpenses] = useState(40000);
  const [employees, setEmployees] = useState(0);
  const [planning, setPlanning] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['selfEmploymentTax', country, businessRevenue, expenses, employees],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateSelfEmploymentTaxPlan', {
        country,
        business_revenue: businessRevenue,
        expenses,
        employees
      });
      return response.data?.plan || {};
    },
    enabled: planning
  });

  const profit = businessRevenue - expenses;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🏪 Selbstständigen-Steuer-Planer</h1>
        <p className="text-slate-500 mt-1">Planen Sie Ihre Selbstständigen-Steuern optimal</p>
      </div>

      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Geschäftsdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="text-sm font-medium">Mitarbeiter</label>
              <Input
                type="number"
                value={employees}
                onChange={(e) => setEmployees(parseInt(e.target.value) || 0)}
                disabled={planning}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Geschäftseinnahmen (€)</label>
              <Input
                type="number"
                value={businessRevenue}
                onChange={(e) => setBusinessRevenue(parseInt(e.target.value) || 0)}
                disabled={planning}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Betriebsausgaben (€)</label>
              <Input
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(parseInt(e.target.value) || 0)}
                disabled={planning}
              />
            </div>
          </div>

          <Button
            onClick={() => setPlanning(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={planning}
          >
            {planning ? '⏳ Wird geplant...' : 'Steuern planen'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Wird geplant...</div>
      ) : planning && result.content ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Gewinn</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">€{Math.round(profit).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Geschätzte Steuerlast</p>
                <p className="text-2xl font-bold text-red-600 mt-2">€{Math.round(result.content?.estimated_tax || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-purple-300 bg-purple-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Sozialversicherung</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">€{Math.round(result.content?.social_contributions || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Nach Steuern</p>
                <p className="text-2xl font-bold text-green-600 mt-2">€{Math.round((profit - (result.content?.estimated_tax || 0) - (result.content?.social_contributions || 0))).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {(result.content?.deduction_opportunities || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">💡 Abzugsmöglichkeiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.deduction_opportunities.map((opp, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {opp}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(result.content?.recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  ✓ Empfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.recommendations.map((rec, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">Geben Sie Ihre Geschäftsdaten ein</div>
      )}
    </div>
  );
}