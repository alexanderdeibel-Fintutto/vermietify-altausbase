import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown, Download, RefreshCw } from 'lucide-react';

export default function TaxCockpit({ userId, year = new Date().getFullYear() }) {
  const { data: carryforwards, isLoading: cfLoading } = useQuery({
    queryKey: ['taxCarryforward', userId, year],
    queryFn: async () => {
      const results = await base44.entities.TaxLossCarryforward.filter(
        { user_id: userId, year },
        '',
        1
      );
      return results[0] || null;
    },
    enabled: !!userId
  });

  const { data: portfolio, isLoading: pfLoading } = useQuery({
    queryKey: ['assetPortfolio', userId],
    queryFn: async () => {
      if (!userId) return [];
      return base44.entities.AssetPortfolio.filter(
        { user_id: userId },
        '-created_date',
        5000
      );
    },
    enabled: !!userId
  });

  // KPI Berechnung
  const totalValue = portfolio?.reduce((sum, a) => sum + (a.quantity * a.current_value), 0) || 0;
  const totalInvested = portfolio?.reduce((sum, a) => sum + (a.quantity * a.purchase_price), 0) || 0;
  const totalGain = totalValue - totalInvested;
  const unrealizedLoss = totalGain < 0 ? Math.abs(totalGain) : 0;

  const handleGenerateTaxForm = async () => {
    try {
      const response = await base44.functions.invoke('generateAnlageKAPPDF', { year });
      console.log('Tax form generated:', response);
      // Hinweis: Echte PDF-Generierung würde hier erfolgen
    } catch (error) {
      console.error('Tax form generation failed:', error);
    }
  };

  const handleCalculateCarryforward = async () => {
    try {
      const response = await base44.functions.invoke('calculateTaxLossCarryforward', { year });
      console.log('Carryforward calculated:', response);
    } catch (error) {
      console.error('Carryforward calculation failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-light flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Steuer-Cockpit {year}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unrealized Losses */}
          {unrealizedLoss > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-light text-yellow-900 mb-1">
                    Unrealisierte Verluste
                  </p>
                  <p className="text-2xl font-light text-yellow-700">
                    €{unrealizedLoss.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs font-light text-yellow-600 mt-1">
                    Diese können durch Verkauf realisiert werden
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loss Carryforward */}
          {carryforwards && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-light text-blue-900 mb-1">Verlustvortrag</p>
                  <p className="text-2xl font-light text-blue-700">
                    €{carryforwards.remaining_amount.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{carryforwards.year}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-light text-blue-600 mt-3">
                <div>Ursprung: €{carryforwards.loss_amount.toLocaleString('de-DE', { maximumFractionDigits: 0 })}</div>
                <div>Genutzt: €{(carryforwards.loss_amount - carryforwards.remaining_amount).toLocaleString('de-DE', { maximumFractionDigits: 0 })}</div>
              </div>
            </div>
          )}

          {/* Tax Optimization Tips */}
          <div className="space-y-3">
            <h4 className="text-sm font-light text-slate-900">Steuer-Optimierungen</h4>
            <div className="space-y-2">
              {unrealizedLoss > 0 && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs font-light text-slate-700">
                  ✓ Verkauf von Position mit Verlust kann Steuerbelastung reduzieren
                </div>
              )}
              {!carryforwards && totalGain < 0 && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs font-light text-slate-700">
                  ✓ Verlustvortrag berechnen für kommende Jahre
                </div>
              )}
              {portfolio && portfolio.length > 0 && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs font-light text-slate-700">
                  ✓ {portfolio.length} Position(en) in Portfolio - Portfolio-Review empfohlen
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-slate-200">
            <Button
              onClick={handleCalculateCarryforward}
              variant="outline"
              className="flex-1 font-light gap-2 text-sm"
              disabled={cfLoading}
            >
              <RefreshCw className="w-4 h-4" />
              Verlustvortrag berechnen
            </Button>
            <Button
              onClick={handleGenerateTaxForm}
              className="flex-1 bg-slate-900 hover:bg-slate-800 font-light gap-2 text-sm"
              disabled={pfLoading}
            >
              <Download className="w-4 h-4" />
              Anlage KAP generieren
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}