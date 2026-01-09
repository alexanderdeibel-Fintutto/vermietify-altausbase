import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertTriangle, TrendingUp, DollarSign, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxForecastWidget({ yearToDateIncome, projectedAnnualIncome, yearToDateExpenses, projectedAnnualExpenses, country = 'DE' }) {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);

  const handleGenerateForecast = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('generateTaxForecast', {
        year_to_date_income: yearToDateIncome || 0,
        projected_annual_income: projectedAnnualIncome || 0,
        year_to_date_expenses: yearToDateExpenses || 0,
        projected_annual_expenses: projectedAnnualExpenses || 0,
        country,
        tax_year: new Date().getFullYear(),
        existing_savings: 0
      });

      if (response.data.success) {
        setForecast(response.data.forecast);
      }
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!forecast) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Steuerprognost
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Erhalten Sie eine Schätzung Ihrer voraussichtlichen Steuerschuld für dieses und nächstes Jahr.
          </p>
          <Button
            onClick={handleGenerateForecast}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird berechnet...
              </>
            ) : (
              'Prognose generieren'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasHighTaxWarnings = forecast.warnings?.some(w => w.level === 'high');
  const highTaxWarnings = forecast.warnings?.filter(w => w.level === 'high') || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Steuerprognost
          </div>
          <Badge variant={hasHighTaxWarnings ? 'destructive' : 'default'}>
            {hasHighTaxWarnings ? 'Warnung!' : 'Aktuell'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Überblick</TabsTrigger>
            <TabsTrigger value="schedule">Zahlungsplan</TabsTrigger>
            <TabsTrigger value="optimize">Optimierung</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Tax Liability */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-1">Geschätzte Steuerschuld 2024</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {forecast.estimated_tax_liability_2024?.amount?.toLocaleString('de-DE')} €
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Konfidenz: {Math.round(forecast.estimated_tax_liability_2024?.confidence * 100)}%
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-1">Prognostiziert 2025</p>
                <p className="text-2xl font-semibold text-blue-900">
                  {forecast.projected_tax_liability_2025?.amount?.toLocaleString('de-DE')} €
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Konfidenz: {Math.round(forecast.projected_tax_liability_2025?.confidence * 100)}%
                </p>
              </div>
            </div>

            {/* Monthly Obligation */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <p className="font-semibold text-sm">Monatliche Zahlungsverpflichtung</p>
              </div>
              <p className="text-2xl font-semibold text-green-900">
                {forecast.monthly_tax_obligation?.amount?.toLocaleString('de-DE')} €/Monat
              </p>
              <p className="text-xs text-slate-600 mt-2">{forecast.monthly_tax_obligation?.description}</p>
            </div>

            {/* Tax Rate Analysis */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-sm">Steuersatzanalyse</p>
              <div className="flex justify-between text-sm">
                <span>Effektiver Steuersatz 2024:</span>
                <span className="font-medium">{Math.round(forecast.tax_rate_analysis?.effective_rate_2024 * 100)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Grenzsteuersatz:</span>
                <span className="font-medium">{Math.round(forecast.tax_rate_analysis?.marginal_rate * 100)}%</span>
              </div>
            </div>

            {/* Warnings */}
            {forecast.warnings && forecast.warnings.length > 0 && (
              <div className="space-y-2">
                {forecast.warnings.map((warning, idx) => (
                  <Alert key={idx} className={
                    warning.level === 'high'
                      ? 'bg-red-50 border-red-200'
                      : warning.level === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }>
                    <AlertTriangle className={`h-4 w-4 ${
                      warning.level === 'high' ? 'text-red-600' :
                      warning.level === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                    <AlertDescription className={`text-sm ${
                      warning.level === 'high' ? 'text-red-800' :
                      warning.level === 'medium' ? 'text-yellow-800' : 'text-blue-800'
                    }`}>
                      <p className="font-semibold">{warning.title}</p>
                      <p className="text-xs mt-1">{warning.description}</p>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-3">
            {forecast.quarterly_payment_schedule?.map((quarter, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">Q{quarter.quarter} {new Date(quarter.due_date).getFullYear()}</p>
                    <p className="text-xs text-slate-600">Fällig: {new Date(quarter.due_date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <p className="font-semibold">{quarter.estimated_payment?.toLocaleString('de-DE')} €</p>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Optimize Tab */}
          <TabsContent value="optimize" className="space-y-3">
            {forecast.optimization_suggestions?.map((suggestion, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-sm">{suggestion.title}</p>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.implementation_difficulty}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mb-2">{suggestion.description}</p>
                {suggestion.potential_savings > 0 && (
                  <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 rounded p-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Potentielle Ersparnis: {suggestion.potential_savings?.toLocaleString('de-DE')} €
                  </div>
                )}
              </div>
            ))}

            {/* Actions */}
            {forecast.actions_required && forecast.actions_required.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="font-semibold text-sm mb-2">Erforderliche Maßnahmen:</p>
                <ul className="text-xs space-y-1">
                  {forecast.actions_required.map((action, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span>→</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleGenerateForecast}
          variant="outline"
          size="sm"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Wird aktualisiert...' : 'Prognose aktualisieren'}
        </Button>
      </CardContent>
    </Card>
  );
}