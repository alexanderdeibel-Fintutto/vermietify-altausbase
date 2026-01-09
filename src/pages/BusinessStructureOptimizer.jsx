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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

export default function BusinessStructureOptimizer() {
  const [country, setCountry] = useState('DE');
  const [annualIncome, setAnnualIncome] = useState(150000);
  const [employees, setEmployees] = useState(2);
  const [comparing, setComparing] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['businessStructureComparison', country, annualIncome, employees],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateBusinessStructureComparison', {
        country,
        annualIncome,
        employees
      });
      return response.data?.comparison || {};
    },
    enabled: comparing
  });

  const chartData = (result.content?.structures || []).map(s => ({
    name: s.name,
    tax_cost: s.tax_cost || 0
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🏢 Geschäftsstruktur-Optimierer</h1>
        <p className="text-slate-500 mt-1">Vergleichen Sie Geschäftsformen und ihre Steuerauswirkungen</p>
      </div>

      {/* Configuration */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Geschäftsprofil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={comparing}>
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
                disabled={comparing}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Geschätztes Jahreseinkommen (€)</label>
            <Input
              type="number"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(parseInt(e.target.value) || 0)}
              disabled={comparing}
            />
          </div>

          <button
            onClick={() => setComparing(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={comparing}
          >
            {comparing ? '⏳ Wird verglichen...' : 'Strukturen vergleichen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Vergleich läuft...</div>
      ) : comparing && result.content ? (
        <>
          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💰 Geschätzte Jahressteuerlast</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${Math.round(value).toLocaleString()}`} />
                    <Bar dataKey="tax_cost" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Recommendation */}
          {result.content?.recommended && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ✓ Empfohlene Struktur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{result.content.recommended}</p>
              </CardContent>
            </Card>
          )}

          {/* Structure Details */}
          {(result.content?.structures || []).map((struct, i) => (
            <Card key={i} className="border-l-4 border-blue-400">
              <CardHeader>
                <CardTitle className="text-sm">{struct.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600">Geschätzte Jahressteuerlast</p>
                  <p className="text-lg font-bold text-red-600">€{Math.round(struct.tax_cost || 0).toLocaleString()}</p>
                </div>

                {struct.advantages && (
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-2">✓ Vorteile</p>
                    <ul className="text-xs space-y-1">
                      {struct.advantages.map((adv, j) => (
                        <li key={j}>• {adv}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {struct.disadvantages && (
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-2">✗ Nachteile</p>
                    <ul className="text-xs space-y-1">
                      {struct.disadvantages.map((dis, j) => (
                        <li key={j}>• {dis}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {struct.liability && (
                  <div>
                    <p className="text-xs font-medium mb-1">Haftung: {struct.liability}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Transition Costs */}
          {result.content?.transition_costs && (
            <Card className="border-orange-300 bg-orange-50">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Geschätzte Umstellungskosten</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  €{Math.round(result.content.transition_costs).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Geben Sie Ihre Geschäftsdaten ein und klicken Sie "Strukturen vergleichen"
        </div>
      )}
    </div>
  );
}