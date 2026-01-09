import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, CheckCircle2, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function ConsolidatedTaxSummary() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: consolidated = {}, isLoading } = useQuery({
    queryKey: ['consolidatedTaxSummary', taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('consolidateTaxSummary', {
        taxYear
      });
      return response.data?.summary || {};
    }
  });

  const getStatusColor = (status) => {
    if (!status) return 'bg-slate-100 text-slate-800';
    const lower = status.toLowerCase();
    if (lower.includes('complete')) return 'bg-green-100 text-green-800';
    if (lower.includes('progress')) return 'bg-blue-100 text-blue-800';
    if (lower.includes('warning')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const countries = [
    { code: 'AT', name: 'Österreich', flag: '🇦🇹' },
    { code: 'CH', name: 'Schweiz', flag: '🇨🇭' },
    { code: 'DE', name: 'Deutschland', flag: '🇩🇪' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Consolidated Tax Summary</h1>
        <p className="text-slate-500 mt-1">Gesamtübersicht Ihrer DACH-Steuersituation</p>
      </div>

      {/* Controls */}
      <div className="flex-1 max-w-xs">
        <label className="text-sm font-medium">Steuerjahr</label>
        <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
            <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Lade Zusammenfassung...</div>
      ) : (
        <>
          {/* Overall Status */}
          <Card className="border-2 border-blue-300 bg-blue-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-sm text-slate-600">Gesamtsteuerlast</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    €{Math.round(
                      (consolidated.countries?.AT?.total_tax || 0) +
                      (consolidated.countries?.CH?.total_tax || 0) +
                      (consolidated.countries?.DE?.total_tax || 0)
                    ).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Anträge eingereicht</p>
                  <p className="text-2xl font-bold mt-2">
                    {(consolidated.countries?.AT?.submitted || 0) +
                     (consolidated.countries?.CH?.submitted || 0) +
                     (consolidated.countries?.DE?.submitted || 0)} / {
                      (consolidated.countries?.AT?.filings || 0) +
                      (consolidated.countries?.CH?.filings || 0) +
                      (consolidated.countries?.DE?.filings || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Bereitschaftsgrad</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {consolidated.consolidation?.overall_readiness || 0}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Compliance-Rate</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {consolidated.consolidation?.compliance_rate || 0}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <Badge className={`${getStatusColor(consolidated.consolidation?.overall_status)} mt-2`}>
                    {consolidated.consolidation?.overall_status || 'UNKNOWN'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Country Breakdown */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold">🌍 Länder-Übersicht</h2>
            {countries.map(country => {
              const data = consolidated.countries?.[country.code] || {};
              return (
                <Card key={country.code}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{country.flag} {country.name}</h3>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        €{Math.round(data.total_tax || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-slate-600">Anträge</p>
                        <p className="font-bold">{data.submitted}/{data.filings}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Dokumente</p>
                        <p className="font-bold">{data.documents}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Compliance</p>
                        <p className="font-bold">{data.completed_compliance}/{data.compliance}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Warnungen</p>
                        <p className={`font-bold ${data.critical_alerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {data.critical_alerts} kritisch
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Anträge</span>
                          <span>{Math.round((data.submitted / (data.filings || 1)) * 100)}%</span>
                        </div>
                        <Progress value={(data.submitted / (data.filings || 1)) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Compliance</span>
                          <span>{Math.round((data.completed_compliance / (data.compliance || 1)) * 100)}%</span>
                        </div>
                        <Progress value={(data.completed_compliance / (data.compliance || 1)) * 100} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Critical Issues */}
          {(consolidated.consolidation?.critical_issues || []).length > 0 && (
            <Alert className="border-red-300 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                <strong>🚨 Kritische Probleme:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  {consolidated.consolidation.critical_issues.map((issue, i) => (
                    <li key={i}>• {issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Key Actions */}
          {(consolidated.consolidation?.key_actions || []).length > 0 && (
            <Alert className="border-blue-300 bg-blue-50">
              <AlertDescription className="text-blue-900">
                <strong className="text-sm">📋 Erforderliche Maßnahmen:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  {consolidated.consolidation.key_actions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ol>
              </AlertDescription>
            </Alert>
          )}

          {/* Next Milestones */}
          {(consolidated.consolidation?.next_milestones || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Nächste Meilensteine</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {consolidated.consolidation.next_milestones.map((milestone, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      {milestone}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}