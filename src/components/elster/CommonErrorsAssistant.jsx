import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";

const COMMON_ERRORS = [
  {
    category: 'Pflichtfelder',
    error: 'Steuernummer fehlt',
    severity: 'critical',
    solution: 'Tragen Sie Ihre Steuernummer ein (Format: 12/345/67890)',
    prevention: 'Steuernummer wird automatisch aus den Gebäudedaten übernommen, wenn vorhanden'
  },
  {
    category: 'Berechnung',
    error: 'Einnahmen-Ausgaben stimmen nicht mit Ergebnis überein',
    severity: 'high',
    solution: 'Prüfen Sie die Summen: Ergebnis = Einnahmen - Ausgaben - AfA',
    prevention: 'Nutzen Sie die automatische Berechnung'
  },
  {
    category: 'AfA',
    error: 'AfA-Betrag unrealistisch',
    severity: 'medium',
    solution: 'AfA sollte 2-2,5% des Gebäudewerts betragen (ohne Grundstück)',
    prevention: 'Lassen Sie die AfA automatisch berechnen'
  },
  {
    category: 'Zertifikat',
    error: 'Zertifikat abgelaufen',
    severity: 'critical',
    solution: 'Laden Sie ein gültiges ELSTER-Zertifikat hoch',
    prevention: 'System warnt 30 Tage vor Ablauf'
  },
  {
    category: 'Validierung',
    error: 'XML entspricht nicht dem Schema',
    severity: 'high',
    solution: 'Führen Sie die Validierung durch, um konkrete Fehler zu sehen',
    prevention: 'Nutzen Sie die Plausibilitätsprüfung vor der Validierung'
  },
  {
    category: 'Daten',
    error: 'Negative Einnahmen',
    severity: 'medium',
    solution: 'Einnahmen dürfen nicht negativ sein. Verluste werden über Ausgaben abgebildet',
    prevention: 'System prüft automatisch auf negative Werte'
  },
  {
    category: 'Datum',
    error: 'Vermietungszeitraum ungültig',
    severity: 'medium',
    solution: 'Von-Datum muss vor Bis-Datum liegen und im gewählten Steuerjahr',
    prevention: 'Datumsfelder validieren automatisch'
  },
  {
    category: 'Plausibilität',
    error: 'Werte weichen stark von Branchendurchschnitt ab',
    severity: 'low',
    solution: 'Prüfen Sie die Werte, ggf. Erklärung beifügen',
    prevention: 'Nutzen Sie den Branchenvergleich zur Orientierung'
  }
];

export default function CommonErrorsAssistant() {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [filter, setFilter] = useState('all');

  const filteredErrors = filter === 'all' 
    ? COMMON_ERRORS 
    : COMMON_ERRORS.filter(e => e.severity === filter);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Häufige Fehler & Lösungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'critical', 'high', 'medium', 'low'].map(severity => (
            <Button
              key={severity}
              variant={filter === severity ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(severity)}
              className="text-xs"
            >
              {severity === 'all' ? 'Alle' : 
               severity === 'critical' ? 'Kritisch' :
               severity === 'high' ? 'Hoch' :
               severity === 'medium' ? 'Mittel' : 'Niedrig'}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredErrors.map((error, idx) => (
            <div key={idx} className="border rounded overflow-hidden">
              <button
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                className="w-full p-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Badge 
                      variant={
                        error.severity === 'critical' ? 'destructive' :
                        error.severity === 'high' ? 'default' : 'outline'
                      }
                      className="text-xs"
                    >
                      {error.category}
                    </Badge>
                    <span className="text-sm font-medium">{error.error}</span>
                  </div>
                  {expandedIndex === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {expandedIndex === idx && (
                <div className="p-3 bg-slate-50 border-t space-y-2">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-xs">
                      <div className="font-medium mb-1">💡 Lösung:</div>
                      {error.solution}
                    </AlertDescription>
                  </Alert>
                  <div className="text-xs text-slate-600">
                    <span className="font-medium">Vermeidung:</span> {error.prevention}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredErrors.length === 0 && (
          <p className="text-sm text-slate-600 text-center py-4">
            Keine Fehler in dieser Kategorie
          </p>
        )}
      </CardContent>
    </Card>
  );
}