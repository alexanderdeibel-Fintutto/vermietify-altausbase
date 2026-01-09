import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function TaxLawUpdates() {
  const [country, setCountry] = useState('DE');

  const { data: monitoring = {}, isLoading } = useQuery({
    queryKey: ['taxLawUpdates', country],
    queryFn: async () => {
      const response = await base44.functions.invoke('monitorTaxLawChanges', {
        country
      });
      return response.data?.monitoring || {};
    }
  });

  const analysis = monitoring.analysis || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📜 Steuerrecht-Updates</h1>
        <p className="text-slate-500 mt-1">Überwachen Sie neue Steuergesetz-Änderungen</p>
      </div>

      {/* Country Selector */}
      <div className="max-w-xs">
        <label className="text-sm font-medium block mb-2">Land</label>
        <Select value={country} onValueChange={setCountry}>
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

      {isLoading ? (
        <div className="text-center py-8">⏳ Updates werden geladen...</div>
      ) : (
        <>
          {/* Stats */}
          <Card className="border-blue-300 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Aktive Gesetzesänderungen</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{monitoring.total_updates || 0}</p>
            </CardContent>
          </Card>

          {/* Critical Changes */}
          {(analysis.critical_changes || []).length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Kritische Änderungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.critical_changes.map((change, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-white rounded">
                    <span className="text-red-600 font-bold">!</span>
                    {change}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Changes */}
          {(analysis.recent_changes || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Aktuelle Änderungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.recent_changes.map((change, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-4 py-3">
                    <h4 className="font-bold text-sm mb-2">{change.title}</h4>
                    <div className="space-y-2 text-xs text-slate-600">
                      {change.impact && <p>📊 {change.impact}</p>}
                      {change.individual_impact && <p>👤 Privatpersonen: {change.individual_impact}</p>}
                      {change.business_impact && <p>🏢 Unternehmen: {change.business_impact}</p>}
                      {change.effective_date && (
                        <p>📅 Gültig ab: {new Date(change.effective_date).toLocaleDateString('de-DE')}</p>
                      )}
                    </div>
                    {change.action_required && change.action_required.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {change.action_required.map((action, j) => (
                          <p key={j} className="text-xs text-blue-600">✓ {action}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Opportunities */}
          {(analysis.opportunities || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Neue Möglichkeiten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.opportunities.map((opp, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-white rounded">
                    <span className="text-green-600 font-bold">→</span>
                    {opp}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compliance Checklist */}
          {(analysis.compliance_checklist || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">✅ Compliance-Checkliste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.compliance_checklist.map((item, i) => (
                  <div key={i} className="flex gap-3 p-2 bg-slate-50 rounded text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}