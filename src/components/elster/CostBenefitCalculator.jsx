import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

export default function CostBenefitCalculator() {
  const [calculating, setCalculating] = useState(false);
  const [results, setResults] = useState(null);

  const handleCalculate = () => {
    setCalculating(true);
    setTimeout(() => {
      setResults({
        time_saved: 45,
        cost_saved: 3500,
        accuracy_improvement: 23,
        roi_months: 3.2
      });
      setCalculating(false);
    }, 1500);
  };

  const features = [
    {
      name: 'KI-Auto-Fill',
      time_saved: '15h/Monat',
      cost: '0€',
      value: 750
    },
    {
      name: 'Batch-Validierung',
      time_saved: '10h/Monat',
      cost: '0€',
      value: 500
    },
    {
      name: 'Auto-Kategorisierung',
      time_saved: '12h/Monat',
      cost: '0€',
      value: 600
    },
    {
      name: 'Smart Correction',
      time_saved: '8h/Monat',
      cost: '0€',
      value: 400
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-green-600" />
          Kosten-Nutzen-Rechner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!results ? (
          <>
            <div className="text-sm text-slate-600 mb-4">
              Berechnet den ROI der ELSTER-Automation
            </div>
            
            <div className="space-y-2">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{feature.name}</div>
                    <div className="text-xs text-slate-600">{feature.time_saved}</div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    ~{feature.value}€
                  </Badge>
                </div>
              ))}
            </div>

            <Button
              onClick={handleCalculate}
              disabled={calculating}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Calculator className="w-4 h-4 mr-2" />
              ROI berechnen
            </Button>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-600">Zeitersparnis</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {results.time_saved}h
                </div>
                <div className="text-xs text-blue-600">pro Monat</div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600">Kostenersparnis</span>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {results.cost_saved}€
                </div>
                <div className="text-xs text-green-600">pro Monat</div>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-purple-600">Genauigkeit</span>
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  +{results.accuracy_improvement}%
                </div>
                <div className="text-xs text-purple-600">Verbesserung</div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calculator className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-orange-600">ROI-Zeit</span>
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  {results.roi_months}
                </div>
                <div className="text-xs text-orange-600">Monate</div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
              <div className="text-sm font-medium mb-2">Jährliche Gesamtersparnis</div>
              <div className="text-3xl font-bold text-green-700 mb-1">
                {(results.cost_saved * 12).toLocaleString('de-DE')} €
              </div>
              <Progress value={85} className="h-2" />
              <div className="text-xs text-slate-600 mt-2">
                85% weniger manuelle Arbeit
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setResults(null)}
              className="w-full"
            >
              Neue Berechnung
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}