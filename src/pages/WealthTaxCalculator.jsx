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
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function WealthTaxCalculator() {
  const [country, setCountry] = useState('CH');
  const [totalWealth, setTotalWealth] = useState(1000000);
  const [realEstate, setRealEstate] = useState(600000);
  const [securities, setSecurities] = useState(300000);
  const [cash, setCash] = useState(100000);
  const [calculating, setCalculating] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['wealthTax', country, totalWealth, realEstate, securities, cash],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateWealthTaxAnalysis', {
        country,
        total_wealth: totalWealth,
        real_estate_value: realEstate,
        securities_value: securities,
        cash_value: cash
      });
      return response.data?.analysis || {};
    },
    enabled: calculating
  });

  const assetData = [
    { name: 'Immobilien', value: realEstate },
    { name: 'Wertpapiere', value: securities },
    { name: 'Bargeld', value: cash }
  ].filter(a => a.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">💎 Vermögenssteuer-Rechner</h1>
        <p className="text-slate-500 mt-1">Berechnen Sie Ihre Vermögenssteuer</p>
      </div>

      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Vermögensaufstellung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={calculating}>
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
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Immobilien (€)</label>
              <Input
                type="number"
                value={realEstate}
                onChange={(e) => setRealEstate(parseInt(e.target.value) || 0)}
                disabled={calculating}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Wertpapiere (€)</label>
              <Input
                type="number"
                value={securities}
                onChange={(e) => setSecurities(parseInt(e.target.value) || 0)}
                disabled={calculating}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bargeld (€)</label>
              <Input
                type="number"
                value={cash}
                onChange={(e) => setCash(parseInt(e.target.value) || 0)}
                disabled={calculating}
              />
            </div>
          </div>

          <Button
            onClick={() => setCalculating(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={calculating}
          >
            {calculating ? '⏳ Wird berechnet...' : 'Berechnen'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Wird berechnet...</div>
      ) : calculating && result.content ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Gesamtvermögen</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">€{Math.round(realEstate + securities + cash).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-orange-300 bg-orange-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Vermögenssteuer</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">€{Math.round(result.content?.wealth_tax || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-purple-300 bg-purple-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Effektiver Satz</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">{((result.content?.wealth_tax || 0) / (realEstate + securities + cash) * 100).toFixed(2)}%</p>
              </CardContent>
            </Card>
          </div>

          {assetData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Vermögensverteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={assetData} cx="50%" cy="50%" labelLine={false} label={({name, value}) => `${name}: €${Math.round(value / 1000)}k`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {assetData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `€${Math.round(value / 1000)}k`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {(result.content?.optimization_strategies || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  💡 Optimierungsstrategien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.optimization_strategies.map((strategy, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {strategy}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">Geben Sie Ihre Vermögensaufstellung ein</div>
      )}
    </div>
  );
}