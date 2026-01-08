import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, XCircle, Lightbulb, TrendingUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function IntelligentValidationResults({ validation, onFix }) {
  if (!validation) return null;

  const { is_valid, confidence_score, errors = [], warnings = [], suggestions = [] } = validation;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Confidence Score */}
      <Card className={is_valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {is_valid ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <div>
                <div className={`font-medium ${is_valid ? 'text-green-900' : 'text-red-900'}`}>
                  {is_valid ? 'Validierung erfolgreich' : 'Validierung fehlgeschlagen'}
                </div>
                <div className="text-sm text-slate-600">
                  {errors.length > 0 && `${errors.length} Fehler · `}
                  {warnings.length > 0 && `${warnings.length} Warnungen · `}
                  {suggestions.length > 0 && `${suggestions.length} Optimierungen`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(confidence_score)}`}>
                {confidence_score}%
              </div>
              <div className="text-xs text-slate-600">KI-Vertrauen</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fehler */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-600">Fehler beheben</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errors.map((error, idx) => (
                <Alert key={idx} className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{error.field}</div>
                        <div className="text-sm mt-1">{error.message}</div>
                        {error.suggestion && (
                          <div className="text-xs mt-2 text-slate-700">
                            💡 {error.suggestion}
                          </div>
                        )}
                      </div>
                      {onFix && (
                        <Button size="sm" onClick={() => onFix(error.field)}>
                          Korrigieren
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnungen */}
      {warnings.length > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="warnings" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span>Warnungen ({warnings.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-2">
                {warnings.map((warning, idx) => (
                  <Alert key={idx} className="bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription>
                      <div className="font-medium">{warning.field}</div>
                      <div className="text-sm mt-1">{warning.message}</div>
                      {warning.suggestion && (
                        <div className="text-xs mt-2 text-slate-700">
                          💡 {warning.suggestion}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Optimierungsvorschläge */}
      {suggestions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base text-blue-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Steueroptimierung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="p-3 bg-white border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{suggestion.message}</div>
                      {suggestion.benefit && (
                        <div className="text-xs text-green-700 mt-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {suggestion.benefit}
                        </div>
                      )}
                      {suggestion.action && (
                        <div className="text-xs text-slate-600 mt-2">
                          👉 {suggestion.action}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}