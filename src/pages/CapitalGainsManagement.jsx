import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function CapitalGainsManagement() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [managing, setManaging] = useState(false);

  const { data: management = {}, isLoading } = useQuery({
    queryKey: ['capitalGainsManagement', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateCapitalGainsManagement', {
        country,
        taxYear
      });
      return response.data?.management || {};
    },
    enabled: managing
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📈 Kapitalgewinne Management</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie Kapitalgewinne und Verluste</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry} disabled={managing}>
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
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={managing}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <button
        onClick={() => setManaging(true)}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
        disabled={managing}
      >
        {managing ? '⏳ Wird analysiert...' : 'Analyse durchführen'}
      </button>

      {isLoading ? (
        <div className="text-center py-8">⏳ Analyse läuft...</div>
      ) : managing && management.content ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Kapitalgewinne</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{management.metrics?.total_gains || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Verfügbare Verluste</p>
                <p className="text-2xl font-bold text-green-600 mt-2">€{Math.round(management.metrics?.available_losses || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Geschätzte Einsparungen</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">€{Math.round(management.content?.estimated_tax_savings || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Gains Summary */}
          {management.content?.gains_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Gewinneübersicht</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(management.content.gains_summary).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b last:border-b-0">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{typeof value === 'number' ? `€${Math.round(value).toLocaleString()}` : value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Harvesting Opportunities */}
          {(management.content?.harvesting_opportunities || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ✓ Verlust-Ernte-Chancen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {management.content.harvesting_opportunities.map((opp, i) => (
                  <div key={i} className="border-l-4 border-green-300 pl-3 py-2 bg-white p-3 rounded">
                    <p className="font-medium text-sm">{opp.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{opp.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Realization Strategy */}
          {management.content?.realization_strategy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  💡 Realisierungsstrategie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{management.content.realization_strategy}</p>
              </CardContent>
            </Card>
          )}

          {/* Compliance Checklist */}
          {(management.content?.compliance_checklist || []).length > 0 && (
            <Card className="border-purple-300 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Compliance-Checkliste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {management.content.compliance_checklist.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Klicken Sie "Analyse durchführen", um Ihre Kapitalgewinne zu analysieren
        </div>
      )}
    </div>
  );
}