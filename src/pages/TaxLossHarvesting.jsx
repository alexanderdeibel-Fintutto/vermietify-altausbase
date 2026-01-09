import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingDown, AlertTriangle, CheckCircle2, DollarSign, Zap } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxLossHarvesting() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const queryClient = useQueryClient();

  // Fetch loss harvesting suggestions
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['lossHarvesting', country, taxYear],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('suggestTaxLossHarvesting', {
        country,
        taxYear
      });
      return data;
    }
  });

  // Fetch existing losses
  const { data: losses = [] } = useQuery({
    queryKey: ['lossCarryforward', country],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.TaxLossCarryforward.filter({
        user_email: user.email,
        country
      }) || [];
    }
  });

  // Record harvested loss
  const recordLossMutation = useMutation({
    mutationFn: (lossData) => base44.entities.TaxLossCarryforward.create(lossData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lossCarryforward'] });
      queryClient.invalidateQueries({ queryKey: ['lossHarvesting'] });
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">⏳ Analysiere Verlustoptimierungspotenziale...</div>;
  }

  if (!suggestions) {
    return <div className="text-center py-8 text-slate-500">Fehler beim Laden der Daten</div>;
  }

  const { summary, opportunities, rules, recommendations } = suggestions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🎯 Tax Loss Harvesting</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie Ihre Kapitalverluste für Steuersparen</p>
      </div>

      {/* Country & Year Selection */}
      <div className="flex gap-4">
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
          <Select value={taxYear.toString()} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingDown className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Unrealisierte Verluste</p>
            <p className="text-3xl font-bold text-red-500 mt-2">
              {summary.total_unrealized_losses.toLocaleString('de-DE')}
              {country === 'AT' || country === 'DE' ? '€' : 'CHF'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6 text-center">
            <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Mögliche Steuereinsparungen</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {Math.round(summary.potential_tax_savings).toLocaleString('de-DE')}
              {country === 'AT' || country === 'DE' ? '€' : 'CHF'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Zap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Optionen</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{summary.opportunities_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Verlustvortrag</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">
              {summary.existing_loss_carryfwards.toLocaleString('de-DE')}
              {country === 'AT' || country === 'DE' ? '€' : 'CHF'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Alert className="border-blue-300 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <ul className="space-y-1 mt-2">
              {recommendations.map((rec, idx) => (
                <li key={idx}>✓ {rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Country-Specific Rules */}
      <Card className="border-slate-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Landesspezifische Regeln ({country})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold">⏰ Wash-Sale-Periode:</p>
            <p className="text-slate-600">{rules.wash_sale_period} Tage</p>
          </div>
          <div>
            <p className="font-semibold">📊 Verlustbegrenzung:</p>
            <p className="text-slate-600">{rules.loss_limitation}</p>
          </div>
          <div>
            <p className="font-semibold">📈 Verlustvortrag:</p>
            <p className="text-slate-600">{rules.carryforward}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Opportunities and History */}
      <Tabs defaultValue="opportunities" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="opportunities">Gelegenheiten ({opportunities.length})</TabsTrigger>
          <TabsTrigger value="history">Verlusthistorie ({losses.length})</TabsTrigger>
        </TabsList>

        {/* Opportunities */}
        <TabsContent value="opportunities" className="space-y-3 mt-4">
          {opportunities.length > 0 ? (
            opportunities.map((opp, idx) => (
              <Card
                key={idx}
                className={opp.estimated_tax_savings > 1000 ? 'border-green-300 bg-green-50' : ''}
              >
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{opp.asset_name}</h4>
                        <p className="text-xs text-slate-600 mt-1">ISIN: {opp.isin}</p>
                      </div>
                      <Badge className={
                        opp.estimated_tax_savings > 1000 ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        Ø {Math.round(opp.estimated_tax_savings)}
                        {country === 'AT' || country === 'DE' ? '€' : 'CHF'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm bg-slate-50 p-3 rounded">
                      <div>
                        <p className="text-slate-600">Anschaffungspreis</p>
                        <p className="font-semibold">{opp.acquisition_price.toLocaleString('de-DE')}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Aktueller Kurs</p>
                        <p className="font-semibold text-red-600">{opp.current_price.toLocaleString('de-DE')}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Unrealisierter Verlust</p>
                        <p className="font-semibold text-red-600">-{opp.unrealized_loss.toLocaleString('de-DE')}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-600">
                        Haltedauer: {opp.holding_period} Jahr(e)
                      </p>
                      <Button
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          recordLossMutation.mutate({
                            user_email: (window.currentUser?.email || ''),
                            country,
                            loss_year: taxYear,
                            loss_type: 'capital_loss',
                            loss_amount: opp.unrealized_loss,
                            loss_description: `${opp.asset_name} (${opp.isin})`,
                            asset_details: {
                              isin: opp.isin,
                              acquisition_price: opp.acquisition_price,
                              current_price: opp.current_price
                            },
                            remaining_amount: opp.unrealized_loss
                          });
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Ernten
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="text-center py-8 text-slate-500">
              Keine Verluste verfügbar zum Ernten
            </Card>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-3 mt-4">
          {losses.length > 0 ? (
            losses
              .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
              .map((loss) => (
                <Card key={loss.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{loss.loss_description}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Verlustvortrag: {loss.loss_year} | Status: {loss.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">
                          -{loss.loss_amount.toLocaleString('de-DE')}
                          {country === 'AT' || country === 'DE' ? '€' : 'CHF'}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Verbleibend: {(loss.remaining_amount || 0).toLocaleString('de-DE')}
                        </p>
                      </div>
                    </div>

                    {loss.used_in_year && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-slate-600">
                          Verrechnet {loss.used_in_year}: -{loss.used_amount.toLocaleString('de-DE')}
                        </p>
                      </div>
                    )}

                    {loss.expiration_date && (
                      <p className="text-xs text-orange-600 mt-2">
                        ⚠️ Verfällt: {new Date(loss.expiration_date).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
          ) : (
            <Card className="text-center py-8 text-slate-500">
              Keine Verlustvorträge vorhanden
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Info Box */}
      <Alert className="border-amber-300 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900 text-sm">
          💡 <strong>Hinweis:</strong> Tax Loss Harvesting ist eine fortgeschrittene Strategie. Konsultieren Sie einen Steuerberater, bevor Sie Positionen verkaufen. Beachten Sie Wash-Sale-Regeln und ersetzen Sie verlorene Positionen nicht innerhalb der angegebenen Frist.
        </AlertDescription>
      </Alert>
    </div>
  );
}