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
import { CheckCircle2, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function AnnualTaxReview() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR - 1);
  const [reviewing, setReviewing] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['annualTaxReview', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateAnnualTaxReview', {
        country,
        tax_year: taxYear
      });
      return response.data?.review || {};
    },
    enabled: reviewing
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📋 Jahres-Steuerergebnis</h1>
        <p className="text-slate-500 mt-1">Umfassende Übersicht Ihrer Steuerergebnisse</p>
      </div>

      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Review-Parameter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={reviewing}>
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
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={reviewing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 2, CURRENT_YEAR - 1].map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() => setReviewing(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={reviewing}
          >
            {reviewing ? '⏳ Wird überprüft...' : 'Review starten'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Review läuft...</div>
      ) : reviewing && result.content ? (
        <>
          {result.content?.summary && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">📊 Übersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{result.content.summary}</p>
              </CardContent>
            </Card>
          )}

          {(result.content?.key_metrics || []).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {result.content.key_metrics.map((metric, i) => (
                <Card key={i}>
                  <CardContent className="pt-6 text-center">
                    <p className="text-xs text-slate-600">{metric.label}</p>
                    <p className="text-lg font-bold text-blue-600 mt-2">{metric.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {(result.content?.compliance_items || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ✓ Compliance-Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.compliance_items.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    ✓ {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(result.content?.improvement_areas || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  💡 Verbesserungsbereiche
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.improvement_areas.map((area, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {area}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(result.content?.next_year_recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🎯 Empfehlungen für nächstes Jahr</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.next_year_recommendations.map((rec, i) => (
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
        <div className="text-center py-8 text-slate-500">Klicken Sie "Review starten"</div>
      )}
    </div>
  );
}