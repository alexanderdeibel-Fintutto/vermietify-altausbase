import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingDown, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxLossHarvesting() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const queryClient = useQueryClient();

  // Fetch suggestions
  const { data: suggestions = {}, isLoading } = useQuery({
    queryKey: ['taxLossHarvesting', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('suggestTaxLossHarvesting', {
        country,
        taxYear
      });
      return response.data?.suggestions || {};
    }
  });

  // Implement harvesting
  const { mutate: implementHarvesting, isLoading: isImplementing } = useMutation({
    mutationFn: (opportunity) =>
      base44.entities.TaxLossCarryforward.create({
        user_email: user.email,
        country,
        loss_year: taxYear,
        loss_type: 'investment_loss',
        loss_amount: opportunity.unrealized_loss,
        loss_description: `${opportunity.asset_name} - Harvested loss`,
        carryforward_period: country === 'AT' ? 'unlimited' : '10_years',
        status: 'pending',
        notes: `Harvested: ${opportunity.alternative_investment}`
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxLossHarvesting'] });
    }
  });

  const opportunityData = (suggestions.opportunities || []).map(opp => ({
    asset: opp.asset_name,
    loss: Math.round(opp.unrealized_loss),
    savings: Math.round(opp.tax_savings)
  }));

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🌱 Tax Loss Harvesting</h1>
        <p className="text-slate-500 mt-1">Identifizieren und nutzen Sie Verluste zur Steueroptimierung</p>
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

      {isLoading ? (
        <div className="text-center py-8">⏳ Analysiere Verlust-Möglichkeiten...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Harvestbare Verluste</p>
                  <p className="text-3xl font-bold mt-2 text-red-600">
                    €{Math.round(suggestions.total_harvestable_losses || 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Geschätzte Steuereinsparungen</p>
                  <p className="text-3xl font-bold mt-2 text-green-600">
                    €{Math.round(suggestions.estimated_tax_savings || 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Opportunities</p>
                  <p className="text-3xl font-bold mt-2">{(suggestions.opportunities || []).length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Implementation Plan */}
          {suggestions.implementation_plan && (
            <Alert className="border-blue-300 bg-blue-50">
              <AlertDescription className="text-blue-900 text-sm">
                <strong>Implementierungsplan:</strong> {suggestions.implementation_plan}
              </AlertDescription>
            </Alert>
          )}

          {/* Risk Assessment */}
          {suggestions.risk_assessment && (
            <Alert className="border-orange-300 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600 inline mr-2" />
              <AlertDescription className="text-orange-900 text-sm inline">
                <strong>Risiko:</strong> {suggestions.risk_assessment}
              </AlertDescription>
            </Alert>
          )}

          {/* Opportunities Chart */}
          {opportunityData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Verlust-Möglichkeiten</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={opportunityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="asset" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="loss" fill="#ef4444" name="Unrealisierter Verlust" />
                    <Bar dataKey="savings" fill="#10b981" name="Steuereinsparungen" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Opportunities List */}
          {(suggestions.opportunities || []).length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">🎯 Top Opportunities</h2>
              {suggestions.opportunities.map((opp, i) => (
                <Card key={i} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{opp.asset_name}</h3>
                          <Badge className={getPriorityColor(opp.priority)}>
                            {opp.priority?.toUpperCase() || 'MEDIUM'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600">Unrealisierter Verlust</p>
                            <p className="text-lg font-bold text-red-600">
                              €{Math.round(opp.unrealized_loss).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600">Steuereinsparungen</p>
                            <p className="text-lg font-bold text-green-600">
                              €{Math.round(opp.tax_savings).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded text-sm">
                      <div>
                        <p className="text-slate-600">⚠️ Wash-Sale Risiko</p>
                        <p className="font-medium mt-1">{opp.wash_sale_risk || 'Low'}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">🔄 Alternative Investment</p>
                        <p className="font-medium mt-1">{opp.alternative_investment || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">⏱️ Timeline</p>
                        <p className="font-medium mt-1">{opp.timeline || 'Immediate'}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => implementHarvesting(opp)}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={isImplementing}
                    >
                      {isImplementing ? '⏳ Implementiere...' : '✓ Harvesting durchführen'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Carryforward Utilization */}
          {(suggestions.carryforward_utilization || []).length > 0 && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">📈 Verlustvortrag-Verwertung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestions.carryforward_utilization.map((cf, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-white rounded border border-blue-200">
                      <div>
                        <p className="font-semibold">Verlustvortrag {cf.loss_year}</p>
                        <p className="text-sm text-slate-600">€{Math.round(cf.amount).toLocaleString()} verfügbar</p>
                        {cf.expiration_date && (
                          <p className="text-xs text-slate-500 mt-1">Verfällt: {cf.expiration_date}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Empfohlene Verrechnung</p>
                        <p className="font-bold text-blue-600">€{Math.round(cf.suggested_offset_gain).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}