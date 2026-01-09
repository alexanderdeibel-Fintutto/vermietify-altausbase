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
import { TrendingDown, Zap, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxDeductionOptimizer() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);

  const { data: optimization = {}, isLoading } = useQuery({
    queryKey: ['taxDeductionOptimization', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('optimizeTaxDeductions', {
        country,
        taxYear
      });
      return response.data?.optimization || {};
    }
  });

  const getComplexityColor = (complexity) => {
    switch (complexity?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">💰 Tax Deduction Optimizer</h1>
        <p className="text-slate-500 mt-1">Maximieren Sie Ihre Steuerabzüge intelligent</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
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
        <div>
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
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Optimiere Abzüge...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Aktuelle Quote</p>
                <p className="text-3xl font-bold mt-2">
                  {optimization.analysis?.current_deduction_rate || 0}%
                </p>
              </CardContent>
            </Card>
            <Card className="border-yellow-300 bg-yellow-50">
              <CardContent className="pt-6 text-center">
                <Zap className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Optimierungs-Potential</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {optimization.analysis?.optimization_potential || 0}%
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <TrendingDown className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Potenzielle Einsparungen</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{Math.round(optimization.analysis?.total_potential_savings || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Deductions List */}
          {(optimization.analysis?.deductions || []).length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold">🎯 Optimierungsmöglichkeiten</h2>
              {optimization.analysis.deductions.map((deduction, idx) => (
                <Card key={idx} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{deduction.name}</h3>
                        <p className="text-sm text-slate-600 mt-1">{deduction.description}</p>
                      </div>
                      <Badge className={getComplexityColor(deduction.complexity)}>
                        {deduction.complexity}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-slate-600">Einsparungen</p>
                        <p className="font-bold text-green-600">
                          €{Math.round(deduction.estimated_savings || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Priorität</p>
                        <Badge className="text-xs mt-1">
                          {deduction.priority?.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-slate-600">Risiko</p>
                        <Badge className={`${getRiskColor(deduction.risk_level)} text-xs mt-1`}>
                          {deduction.risk_level?.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-slate-600">Zeitrahmen</p>
                        <p className="font-medium text-xs">{deduction.timeline}</p>
                      </div>
                    </div>

                    {(deduction.documentation_needed || []).length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-700 mb-2">📋 Erforderliche Dokumente:</p>
                        <div className="flex flex-wrap gap-1">
                          {deduction.documentation_needed.map((doc, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Implementation Steps */}
          {(optimization.analysis?.implementation_steps || []).length > 0 && (
            <Alert className="border-blue-300 bg-blue-50">
              <AlertDescription className="text-blue-900">
                <strong className="text-sm">📋 Implementierungsschritte:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  {optimization.analysis.implementation_steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}