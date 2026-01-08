import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calculator } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TaxPredictionCard({ buildingId = null }) {
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  const runPrediction = async () => {
    setPredicting(true);
    try {
      const response = await base44.functions.invoke('predictTaxLiability', {
        building_id: buildingId,
        target_year: targetYear
      });

      if (response.data.success) {
        setPrediction(response.data);
        toast.success('Vorhersage erstellt');
      }
    } catch (error) {
      toast.error('Vorhersage fehlgeschlagen');
      console.error(error);
    } finally {
      setPredicting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Steuer-Vorhersage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="number"
            value={targetYear}
            onChange={(e) => setTargetYear(parseInt(e.target.value))}
            placeholder="Jahr"
            className="w-32"
          />
          <Button onClick={runPrediction} disabled={predicting}>
            <Calculator className="w-4 h-4 mr-2" />
            Vorhersagen
          </Button>
        </div>

        {prediction && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Vertrauen</span>
              <Badge variant={prediction.confidence === 'high' ? 'default' : 'secondary'}>
                {prediction.confidence}
              </Badge>
            </div>

            <div className="p-4 bg-emerald-50 rounded-lg">
              <div className="text-xs text-slate-600 mb-1">Vorhergesagte Steuerlast</div>
              <div className="text-3xl font-bold text-emerald-700">
                €{prediction.prediction.geschaetzte_steuerlast.toLocaleString('de-DE')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded">
                <div className="text-xs text-slate-600">Einnahmen</div>
                <div className="font-medium">
                  €{prediction.prediction.einnahmen.toLocaleString('de-DE')}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded">
                <div className="text-xs text-slate-600">Ausgaben</div>
                <div className="font-medium">
                  €{prediction.prediction.ausgaben.toLocaleString('de-DE')}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Basierend auf {prediction.based_on_years.length} Jahren Daten: {prediction.based_on_years.join(', ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}