import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function RentOptimizationAdvisor({ unitId, currentRent }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('optimizeRentPrice', {
        unitId,
        currentRent
      });

      setResult(response.data.optimization);
      toast.success('Analyse abgeschlossen');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Mietpreisoptimierung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Aktuelle Miete</p>
                <p className="text-2xl font-bold text-slate-900">€{currentRent.toFixed(2)}</p>
              </div>

              <Button
                onClick={handleOptimize}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analysiere...
                  </>
                ) : (
                  'Marktanalyse starten'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">Optimierungsempfehlung</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Price Comparison */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
                <p className="text-xs text-slate-600">Aktuell</p>
                <p className="font-bold text-lg mt-1">€{result.current_rent.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-green-300">
                <p className="text-xs text-green-700">Empfohlen</p>
                <p className="font-bold text-lg text-green-600 mt-1">€{result.recommended_rent.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
                <p className="text-xs text-slate-600">Marktpreis</p>
                <p className="font-bold text-lg mt-1">€{result.market_rate.toFixed(2)}</p>
              </div>
            </div>

            {/* Increase */}
            {result.increase_percentage !== 0 && (
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600">Empfohlene Steigerung</p>
                <p className={`text-xl font-bold mt-1 ${result.increase_percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.increase_percentage > 0 ? '+' : ''}{result.increase_percentage.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Differenz: €{(result.recommended_rent - result.current_rent).toFixed(2)}/Monat
                </p>
              </div>
            )}

            {/* Confidence */}
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-sm text-slate-600">Analysevertrauen</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-1">{(result.confidence * 100).toFixed(0)}% sicher</p>
            </div>

            {/* Reasoning */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <p className="font-bold text-sm text-slate-900 mb-2">Begründung</p>
              <p className="text-sm text-slate-700 mb-3">{result.reasoning}</p>

              <p className="font-bold text-sm text-slate-900 mb-2">Marktanalyse</p>
              <p className="text-sm text-slate-700">{result.market_analysis}</p>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="font-bold text-sm text-blue-900 mb-2">Empfehlungen</p>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-blue-900">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Legal */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="font-bold text-sm text-yellow-900 mb-1">Rechtliche Grenzen</p>
              <p className="text-sm text-yellow-900">{result.legal_considerations}</p>
            </div>

            <Button
              onClick={() => setResult(null)}
              variant="outline"
              className="w-full"
            >
              Neue Analyse
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}