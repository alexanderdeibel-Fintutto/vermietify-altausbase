import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Zap, TrendingDown, CheckCircle2, AlertTriangle, Clock, Target
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxOptimizationAnalyzer() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const queryClient = useQueryClient();

  // Fetch analysis
  const { data: analysis = {}, isLoading } = useQuery({
    queryKey: ['taxOptimization', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('analyzeTaxOptimization', {
        country,
        taxYear
      });
      return response.data?.analysis || {};
    }
  });

  // Implement recommendation
  const { mutate: implementRecommendation, isLoading: isImplementing } = useMutation({
    mutationFn: async (recommendation) => {
      const user = await base44.auth.me();
      return base44.entities.TaxPlanning.create({
        user_email: user.email,
        country,
        tax_year: taxYear,
        planning_type: recommendation.category || 'income_optimization',
        title: recommendation.title,
        description: recommendation.description,
        estimated_savings: recommendation.estimated_savings || 0,
        implementation_effort: recommendation.effort?.toLowerCase() || 'medium',
        risk_level: recommendation.risk?.toLowerCase() || 'low',
        status: 'planned'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxOptimization'] });
    }
  });

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

  const getEffortColor = (effort) => {
    switch (effort?.toLowerCase()) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  const chartData = (analysis.recommendations || []).map(rec => ({
    name: rec.title?.substring(0, 15) + '...',
    savings: Math.round(rec.estimated_savings || 0)
  }));

  if (isLoading) {
    return <div className="text-center py-8">⏳ Lade Optimierungsanalyse...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">💡 Tax Optimization Analyzer</h1>
        <p className="text-slate-500 mt-1">KI-gestützte Analyse von Steuereinsparungsmöglichkeiten</p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 max-w-xs">
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
      </div>

      {/* Savings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6 text-center">
            <TrendingDown className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Potenzielle Einsparungen</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              €{Math.round(analysis.total_potential_savings || 0).toLocaleString('de-DE')}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {analysis.savings_percentage || 0}% der aktuellen Steuerlast
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Aktuelle Steuerlast</p>
            <p className="text-3xl font-bold mt-2">
              €{Math.round(analysis.current_tax || 0).toLocaleString('de-DE')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Empfehlungen</p>
            <p className="text-3xl font-bold mt-2">
              {(analysis.recommendations || []).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Actions Alert */}
      {(analysis.priority_actions || []).length > 0 && (
        <Alert className="border-blue-300 bg-blue-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>🎯 Sofort-Maßnahmen:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              {analysis.priority_actions.map((action, i) => (
                <li key={i}>• {action}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Country Summary */}
      {analysis.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📊 Steuersystem Zusammenfassung</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 leading-relaxed">
            {analysis.summary}
          </CardContent>
        </Card>
      )}

      {/* Savings Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">💰 Einsparungspotenzial nach Maßnahme</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `€${value.toLocaleString('de-DE')}`} />
                <Bar dataKey="savings" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">🎯 Detaillierte Empfehlungen</h2>
        {(analysis.recommendations || []).map((rec, idx) => (
          <RecommendationCard
            key={idx}
            recommendation={rec}
            onImplement={() => implementRecommendation(rec)}
            isImplementing={isImplementing}
          />
        ))}
      </div>

      {/* No Recommendations */}
      {(!analysis.recommendations || analysis.recommendations.length === 0) && (
        <Card className="text-center py-8">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-slate-600">
            Ihre Steuersituation ist gut optimiert. Keine weiteren Maßnahmen empfohlen.
          </p>
        </Card>
      )}
    </div>
  );
}

function RecommendationCard({ recommendation, onImplement, isImplementing }) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-6 space-y-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-base">{recommendation.title}</h3>
            <p className="text-sm text-slate-600 mt-2">{recommendation.description}</p>
          </div>
          <Badge className="bg-blue-100 text-blue-800 flex-shrink-0">
            {recommendation.category?.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-slate-600">Einsparungen</p>
            <p className="font-bold text-green-600">
              €{Math.round(recommendation.estimated_savings || 0).toLocaleString('de-DE')}
            </p>
          </div>
          <div>
            <p className="text-slate-600">Risiko</p>
            <p className={`font-semibold ${getRiskColor(recommendation.risk)} inline-block px-2 py-1 rounded text-xs`}>
              {recommendation.risk?.charAt(0).toUpperCase() + (recommendation.risk?.slice(1) || '')}
            </p>
          </div>
          <div>
            <p className="text-slate-600">Aufwand</p>
            <p className={`font-semibold ${getEffortColor(recommendation.effort)}`}>
              {recommendation.effort?.charAt(0).toUpperCase() + (recommendation.effort?.slice(1) || '')}
            </p>
          </div>
          <div>
            <p className="text-slate-600">Zeitrahmen</p>
            <p className="font-semibold">{recommendation.timeline || 'Variabel'}</p>
          </div>
        </div>

        {/* Actions */}
        {recommendation.actions && recommendation.actions.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">📋 Erforderliche Maßnahmen:</p>
            <ul className="space-y-1 text-sm text-slate-600">
              {recommendation.actions.map((action, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-blue-600">→</span> {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Implementation Button */}
        <Button
          onClick={onImplement}
          disabled={isImplementing}
          className="w-full bg-green-600 hover:bg-green-700 gap-2 mt-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isImplementing ? 'Wird implementiert...' : 'In Plan aufnehmen'}
        </Button>
      </CardContent>
    </Card>
  );
}