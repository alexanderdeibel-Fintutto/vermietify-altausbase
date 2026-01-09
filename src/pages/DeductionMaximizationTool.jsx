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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Target, TrendingDown } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DeductionMaximizationTool() {
  const [country, setCountry] = useState('DE');
  const [income, setIncome] = useState(80000);
  const [status, setStatus] = useState('single');
  const [maximizing, setMaximizing] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['deductionMaximization', country, income, status],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateDeductionMaximization', {
        country,
        income,
        filing_status: status
      });
      return response.data || {};
    },
    enabled: maximizing
  });

  const chartData = (result.optimization?.deduction_breakdown || []).map((item, i) => ({
    name: item.category,
    value: item.amount
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🎯 Abzugs-Maximierer</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie Ihre Steuerabzüge</p>
      </div>

      {/* Configuration */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Eingaben</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={maximizing}>
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
              <label className="text-sm font-medium">Familienstand</label>
              <Select value={status} onValueChange={setStatus} disabled={maximizing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Ledig</SelectItem>
                  <SelectItem value="married">Verheiratet</SelectItem>
                  <SelectItem value="divorced">Geschieden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Einkommen (€)</label>
              <Input
                type="number"
                value={income}
                onChange={(e) => setIncome(parseInt(e.target.value) || 0)}
                disabled={maximizing}
              />
            </div>
          </div>

          <Button
            onClick={() => setMaximizing(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={maximizing}
          >
            {maximizing ? '⏳ Wird optimiert...' : 'Abzüge maximieren'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Wird optimiert...</div>
      ) : maximizing && result.optimization ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Gesamtabzüge</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  €{Math.round(result.optimization.total_deductions || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Geschätzte Steuereinsparungen</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{Math.round(result.optimization.estimated_savings || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Zu versteuerndes Einkommen</p>
                <p className="text-2xl font-bold text-slate-600 mt-2">
                  €{Math.round((income - (result.optimization.total_deductions || 0))).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Abzüge nach Kategorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label label={({name, value}) => `${name}: €${Math.round(value)}`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `€${Math.round(value)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Deductions List */}
          {(result.optimization?.deduction_breakdown || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💰 Verfügbare Abzüge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.optimization.deduction_breakdown.map((ded, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded flex justify-between">
                    <span className="font-medium">{ded.category}</span>
                    <span className="text-blue-600 font-bold">€{Math.round(ded.amount).toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {(result.optimization?.recommendations || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.optimization.recommendations.map((rec, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Geben Sie Ihre Daten ein und klicken Sie "Abzüge maximieren"
        </div>
      )}
    </div>
  );
}