import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function MultiCountryComparison() {
  const [loading, setLoading] = useState(false);
  const [taxYear] = useState(new Date().getFullYear() - 1);
  const [comparison, setComparison] = useState(null);

  const generateComparison = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const response = await base44.functions.invoke('generateMultiCountryTaxReport', {
        tax_year: taxYear
      });
      return response.data;
    },
    onSuccess: (data) => {
      setComparison(data);
      setLoading(false);
    }
  });

  if (!comparison) {
    return (
      <Card>
        <CardContent className="pt-4">
          <Button onClick={() => generateComparison.mutate()} disabled={loading} className="w-full">
            {loading ? 'Analysiere...' : 'Multi-Country Vergleich generieren'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const countries = comparison.countries || [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-light">Ländervergleich {taxYear}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {countries.map(country => {
          const report = comparison.country_reports?.[country];
          if (!report) return null;

          return (
            <Card key={country}>
              <CardHeader>
                <CardTitle className="text-sm">{country === 'CH' ? 'Schweiz' : country === 'DE' ? 'Deutschland' : 'Österreich'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 font-light">Gesamteinkommen</p>
                  <p className="text-lg font-light">${report.total_income?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-light">Geschätzte Steuer</p>
                  <p className="text-lg font-light text-orange-600">${report.estimated_tax?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-light">Frist</p>
                  <p className="text-sm font-light">{report.filing_deadline}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-light mb-1">Erforderliche Formulare</p>
                  <ul className="text-xs space-y-1">
                    {report.required_forms?.map((form, i) => (
                      <li key={i} className="text-slate-600">• {form}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {comparison.optimization_recommendations && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              💡 Optimierungsvorschläge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-light">
            {comparison.optimization_recommendations.treaty_opportunities?.map((opp, i) => (
              <p key={i}>✓ {opp}</p>
            ))}
            {comparison.optimization_recommendations.structural_recommendations?.map((rec, i) => (
              <p key={i}>→ {rec}</p>
            ))}
            {comparison.optimization_recommendations.estimated_total_savings && (
              <p className="text-green-700 font-semibold mt-2">
                💰 Geschätzte Einsparungen: ${comparison.optimization_recommendations.estimated_total_savings.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}