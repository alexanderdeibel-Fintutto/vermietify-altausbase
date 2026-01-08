import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export default function ValidationPreview({ formData, validationResult }) {
  if (!validationResult) return null;

  const { is_valid, errors = [], warnings = [], plausibility_checks = [] } = validationResult;

  const passed = plausibility_checks.filter(c => c.passed).length;
  const total = plausibility_checks.length;

  return (
    <div className="space-y-4">
      {/* Gesamtstatus */}
      <Card className={`border-2 ${is_valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {is_valid ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            Validierungsergebnis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-lg">
              {is_valid ? 'Formular ist gültig ✓' : 'Formular hat Fehler'}
            </span>
            <Badge variant={is_valid ? 'default' : 'destructive'}>
              {passed} / {total} Prüfungen bestanden
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Fehler */}
      {errors.length > 0 && (
        <Card className="border-2 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <XCircle className="w-5 h-5" />
              Fehler ({errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {errors.map((error, idx) => (
              <Alert key={idx} className="bg-red-50 border-red-200">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  <strong>{error.field}:</strong> {error.message}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warnungen */}
      {warnings.length > 0 && (
        <Card className="border-2 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertTriangle className="w-5 h-5" />
              Warnungen ({warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {warnings.map((warning, idx) => (
              <Alert key={idx} className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  <strong>{warning.field}:</strong> {warning.message}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Plausibilitätsprüfungen */}
      {plausibility_checks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Plausibilitätsprüfungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plausibility_checks.map((check, idx) => (
              <div 
                key={idx} 
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  check.passed ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                {check.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{check.name}</div>
                  <div className="text-sm text-slate-600">{check.message}</div>
                  {check.details && (
                    <div className="text-xs text-slate-500 mt-1">{check.details}</div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}