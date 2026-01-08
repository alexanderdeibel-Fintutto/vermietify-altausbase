import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Loader2, ArrowRight, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export default function IntelligentFormSuggestion({ onCreateForm }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-for-suggestions'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['existing-submissions'],
    queryFn: () => base44.entities.ElsterSubmission.list()
  });

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analysiere die Objekte und existierenden ELSTER-Einreichungen und empfehle welche Steuerformulare erstellt werden sollten.

OBJEKTE: ${buildings.length} Objekte
EXISTIERENDE EINREICHUNGEN: ${submissions.length}

Aktuelles Jahr: ${new Date().getFullYear()}
Letztes Jahr: ${new Date().getFullYear() - 1}

Analysiere:
1. Welche Objekte haben noch keine Anlage V für das letzte Jahr?
2. Welche rechtlichen Strukturen (GbR, GmbH, etc.) benötigen spezielle Formulare?
3. Gibt es gewerbliche Vermietung → Gewerbesteuer?
4. Gibt es Umsatzsteuer-Pflicht?
5. Sind EÜR-Einreichungen nötig?

Empfehle konkret:
- Formular-Typ
- Objekt/Rechtsform
- Jahr
- Priorität (hoch/mittel/niedrig)
- Frist
- Begründung`,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  form_type: { type: 'string' },
                  building_name: { type: 'string' },
                  building_id: { type: 'string' },
                  year: { type: 'number' },
                  priority: { type: 'string' },
                  deadline: { type: 'string' },
                  reason: { type: 'string' },
                  estimated_time: { type: 'string' }
                }
              }
            },
            summary: { type: 'string' }
          }
        }
      });

      setSuggestions(response);
      toast.success('Analyse abgeschlossen');
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const priorityColors = {
    hoch: 'bg-red-100 text-red-800 border-red-200',
    mittel: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    niedrig: 'bg-green-100 text-green-800 border-green-200'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Intelligente Formular-Empfehlungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestions ? (
          <div className="text-center py-8">
            <Lightbulb className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
            <p className="text-slate-600 mb-4">
              KI analysiert Ihre Objekte und empfiehlt benötigte Steuerformulare
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Lightbulb className="w-4 h-4 mr-2" />
              )}
              Empfehlungen generieren
            </Button>
          </div>
        ) : (
          <>
            {suggestions.summary && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">{suggestions.summary}</p>
              </div>
            )}

            <div className="space-y-3">
              {suggestions.suggestions?.map((sugg, idx) => (
                <div 
                  key={idx}
                  className="p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-slate-600" />
                        <span className="font-medium">{sugg.building_name || 'Objekt'}</span>
                      </div>
                      <div className="text-sm text-slate-600 mb-1">
                        {sugg.form_type} · {sugg.year}
                      </div>
                    </div>
                    <Badge className={priorityColors[sugg.priority?.toLowerCase()]}>
                      {sugg.priority}
                    </Badge>
                  </div>

                  <div className="text-sm text-slate-700 mb-3 bg-slate-50 p-2 rounded">
                    {sugg.reason}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                    <span>Frist: {sugg.deadline}</span>
                    <span>Zeitaufwand: {sugg.estimated_time}</span>
                  </div>

                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      onCreateForm({
                        form_type: sugg.form_type,
                        building_id: sugg.building_id,
                        tax_year: sugg.year
                      });
                    }}
                  >
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Jetzt erstellen
                  </Button>
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