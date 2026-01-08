import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Loader2, TrendingUp, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function OptimizationAssistant() {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analysiere Steueroptimierungsmöglichkeiten für 2024/2025 im Kontext von Immobilienvermietung:

Gib praktische, legale Optimierungsvorschläge zu:
1. AfA-Optimierung
2. Werbungskosten-Maximierung
3. Investitionsabzugsbeträge
4. Rücklagenbildung
5. Betriebsausgaben

Für jeden Vorschlag: Titel, Beschreibung, geschätztes Einsparpotenzial in €, Aufwand (niedrig/mittel/hoch)`,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  potential_savings: { type: 'number' },
                  effort: { type: 'string' },
                  category: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setSuggestions(response.suggestions || []);
      toast.success('Analyse abgeschlossen');
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const totalSavings = suggestions?.reduce((sum, s) => sum + (s.potential_savings || 0), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Steuer-Optimierungs-Assistent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestions ? (
          <Button 
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Lightbulb className="w-4 h-4 mr-2" />
            )}
            Optimierungen analysieren
          </Button>
        ) : (
          <>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Geschätztes Einsparpotenzial</span>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-5 h-5 text-green-700" />
                  <span className="text-2xl font-bold text-green-800">
                    {totalSavings.toLocaleString('de-DE')} €
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {suggestions.map((sugg, idx) => (
                <div key={idx} className="p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-sm">{sugg.title}</div>
                    <Badge variant={
                      sugg.effort === 'niedrig' ? 'default' : 
                      sugg.effort === 'mittel' ? 'secondary' : 
                      'outline'
                    }>
                      {sugg.effort}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-slate-600 mb-2">
                    {sugg.description}
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {sugg.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-green-700 font-medium text-sm">
                      <TrendingUp className="w-3 h-3" />
                      ~{sugg.potential_savings?.toLocaleString('de-DE')} €
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              variant="outline" 
              onClick={() => setSuggestions(null)}
              className="w-full"
            >
              Neue Analyse
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}