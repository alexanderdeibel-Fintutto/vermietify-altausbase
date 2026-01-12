import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export default function SmartCategorizationAssistant({ invoice, onCategorySelected }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const { data: categories = [] } = useQuery({
    queryKey: ['costCategories'],
    queryFn: () => base44.entities.CostCategory.filter({ aktiv: true })
  });

  const analyzeInvoice = async () => {
    setAnalyzing(true);
    try {
      // AI-Analyse basierend auf Lieferant und Rechnungstext
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analysiere diese Rechnung und schlage die passende Kostenkategorie vor:
        
Lieferant: ${invoice.lieferant_name}
Rechnungsnummer: ${invoice.rechnungsnummer || 'keine'}
Betrag: ${invoice.betrag_netto}€
Bemerkungen: ${invoice.bemerkungen || 'keine'}

Verfügbare Kategorien:
${categories.map(c => `- ${c.code}: ${c.name} (${c.kategorie_typ})`).join('\n')}

Gib die 3 wahrscheinlichsten Kategorien zurück mit Begründung.`,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category_code: { type: 'string' },
                  confidence: { type: 'number' },
                  reasoning: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Kategorisierung fehlgeschlagen:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-base text-purple-900">KI-Kategorisierungs-Assistent</CardTitle>
          </div>
          {!analyzing && suggestions.length === 0 && (
            <Button size="sm" onClick={analyzeInvoice} className="bg-purple-600 hover:bg-purple-700">
              Analysieren
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {analyzing && (
          <div className="text-center py-4">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-purple-700">Analysiere Rechnung...</p>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => {
              const category = categories.find(c => c.code === suggestion.category_code);
              if (!category) return null;

              return (
                <div
                  key={index}
                  className="bg-white rounded-lg p-3 border border-purple-200 hover:border-purple-400 cursor-pointer transition-colors"
                  onClick={() => onCategorySelected(category.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          suggestion.confidence >= 80 ? 'bg-emerald-100 text-emerald-700' :
                          suggestion.confidence >= 60 ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }>
                          {suggestion.confidence}% Sicher
                        </Badge>
                        <p className="font-medium text-slate-900">{category.name}</p>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{suggestion.reasoning}</p>
                      <div className="flex gap-2 mt-2">
                        {category.ist_steuerlich_absetzbar && (
                          <Badge variant="outline" className="text-xs">Steuerlich absetzbar</Badge>
                        )}
                        {category.ist_umlagefaehig && (
                          <Badge variant="outline" className="text-xs">Umlagefähig</Badge>
                        )}
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {suggestions.length === 0 && !analyzing && (
          <p className="text-sm text-purple-700 text-center py-4">
            Klicken Sie auf "Analysieren" für KI-Vorschläge
          </p>
        )}
      </CardContent>
    </Card>
  );
}