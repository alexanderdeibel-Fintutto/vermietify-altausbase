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
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxComplianceChecker() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [checking, setChecking] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['complianceCheck', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('validateComplianceStatus', {
        country,
        tax_year: taxYear
      });
      return response.data?.compliance || {};
    },
    enabled: checking
  });

  const getIcon = (status) => {
    if (status === 'completed') return { icon: CheckCircle2, color: 'text-green-600' };
    if (status === 'in_progress') return { icon: Clock, color: 'text-blue-600' };
    return { icon: AlertTriangle, color: 'text-red-600' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">✓ Steuer-Compliance-Prüfer</h1>
        <p className="text-slate-500 mt-1">Überprüfen Sie Ihre Einhaltung aller Steueranforderungen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry} disabled={checking}>
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
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={checking}>
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
        <Button
          onClick={() => setChecking(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
          disabled={checking}
        >
          {checking ? '⏳...' : 'Prüfen'}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Wird überprüft...</div>
      ) : checking && result.content ? (
        <>
          {result.content?.overall_status && (
            <Card className={
              result.content.overall_status === 'compliant' ? 'border-green-300 bg-green-50' :
              result.content.overall_status === 'at_risk' ? 'border-orange-300 bg-orange-50' : 'border-red-300 bg-red-50'
            }>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold">Compliance-Status</h2>
                  <span className={`text-2xl font-bold ${
                    result.content.overall_status === 'compliant' ? 'text-green-600' :
                    result.content.overall_status === 'at_risk' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {result.content.overall_status}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {(result.content?.requirements || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Compliance-Anforderungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.requirements.map((req, i) => {
                  const icon = getIcon(req.status);
                  const Icon = icon.icon;
                  return (
                    <div key={i} className="p-3 bg-slate-50 rounded flex items-start gap-3">
                      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${icon.color}`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{req.requirement}</p>
                        <p className="text-xs text-slate-600 mt-1">{req.description}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-slate-200 rounded">{req.status}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {(result.content?.issues || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm">⚠️ Erkannte Probleme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.issues.map((issue, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {issue}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(result.content?.corrective_actions || []).length > 0 && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Maßnahmen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.corrective_actions.map((action, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {action}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">Klicken Sie "Prüfen", um die Compliance zu überprüfen</div>
      )}
    </div>
  );
}