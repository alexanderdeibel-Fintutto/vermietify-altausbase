import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, TrendingDown } from 'lucide-react';

export default function RiskAssessmentPanel({ portfolio }) {
  if (!portfolio || portfolio.length === 0) return null;

  const totalValue = portfolio.reduce((sum, p) => sum + (p.current_value * p.quantity), 0);
  const concentration = portfolio.map(p => (p.current_value * p.quantity) / totalValue).sort((a, b) => b - a);
  const herfindahl = concentration.reduce((sum, c) => sum + Math.pow(c, 2), 0);
  
  const diversification = herfindahl < 0.2 ? 'Gut' : herfindahl < 0.4 ? 'Mittel' : 'Schwach';
  const diversificationColor = diversification === 'Gut' ? 'bg-green-100' : diversification === 'Mittel' ? 'bg-yellow-100' : 'bg-red-100';
  const diversificationBadge = diversification === 'Gut' ? 'bg-green-500' : diversification === 'Mittel' ? 'bg-yellow-500' : 'bg-red-500';

  const volatilityRisk = portfolio.filter(p => ['crypto'].includes(p.asset_category)).length > 0 ? 'Hoch' : 'Mittel';
  const currencyRisk = portfolio.filter(p => p.currency !== 'EUR').length > 0 ? 'Vorhanden' : 'Keine';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Risikobewertung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Diversification */}
          <div className={`p-4 rounded-lg ${diversificationColor}`}>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Diversifikation</h4>
                <p className="text-sm text-slate-600">Herfindahl-Index: {herfindahl.toFixed(3)}</p>
              </div>
              <Badge className={diversificationBadge}>{diversification}</Badge>
            </div>
          </div>

          {/* Concentration Risk */}
          {concentration[0] > 0.5 && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Konzentrationrisiko</AlertTitle>
              <AlertDescription>
                Ihre größte Position macht {(concentration[0] * 100).toFixed(1)}% des Portfolios aus.
              </AlertDescription>
            </Alert>
          )}

          {/* Volatility Risk */}
          <div className="p-4 rounded-lg bg-slate-50 border">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Volatilitätsrisiko</h4>
                <p className="text-sm text-slate-600">Schwankungsanfälligkeit</p>
              </div>
              <Badge variant="outline">{volatilityRisk}</Badge>
            </div>
          </div>

          {/* Currency Risk */}
          {currencyRisk !== 'Keine' && (
            <Alert>
              <TrendingDown className="w-4 h-4" />
              <AlertTitle>Währungsrisiko</AlertTitle>
              <AlertDescription>
                {portfolio.filter(p => p.currency !== 'EUR').length} Position(en) in Fremdwährung
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}