import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AdvancedValidationPanel({ submissionId }) {
  const [validating, setValidating] = useState(false);
  const [results, setResults] = useState(null);

  const runValidation = async () => {
    setValidating(true);
    try {
      const response = await base44.functions.invoke('advancedDataValidation', {
        submission_id: submissionId
      });

      if (response.data.success) {
        setResults(response.data.validation);
        toast.success('Validierung abgeschlossen');
      }
    } catch (error) {
      toast.error('Validierung fehlgeschlagen');
      console.error(error);
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Erweiterte Validierung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!results ? (
          <Button onClick={runValidation} disabled={validating} className="w-full">
            {validating ? 'Validiere...' : 'Erweiterte Prüfung starten'}
          </Button>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="font-medium">Status</span>
              <Badge variant={results.passed ? 'default' : 'destructive'}>
                {results.passed ? 'Bestanden' : 'Fehler'}
              </Badge>
            </div>

            {results.errors.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-red-600">Fehler</div>
                {results.errors.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {results.warnings.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-yellow-600">Warnungen</div>
                {results.warnings.map((warn, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {results.suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-blue-600">Vorschläge</div>
                {results.suggestions.map((sugg, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                    <span>{sugg}</span>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={runValidation} variant="outline" size="sm" className="w-full">
              Erneut prüfen
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}