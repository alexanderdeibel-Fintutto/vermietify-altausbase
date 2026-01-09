import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function TaxValidationDisplay({ validation, isLoading }) {
  if (isLoading) {
    return <div className="text-center py-4">⏳ Validierung läuft...</div>;
  }

  if (!validation) return null;

  const { isValid, errors, warnings, info, summary } = validation;

  return (
    <div className="space-y-3">
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {isValid ? (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Valide
          </Badge>
        ) : (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Fehler
          </Badge>
        )}
        {warnings.length > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {warnings.length} Warnung{warnings.length !== 1 ? 'en' : ''}
          </Badge>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert className="border-red-300 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="font-semibold text-red-800 mb-2">{errors.length} Fehler:</div>
            <ul className="space-y-1 text-sm text-red-700">
              {errors.map((error, idx) => (
                <li key={idx} className="flex gap-2">
                  <span>•</span> {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert className="border-yellow-300 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <div className="font-semibold text-yellow-800 mb-2">Warnungen:</div>
            <ul className="space-y-1 text-sm text-yellow-700">
              {warnings.map((warning, idx) => (
                <li key={idx} className="flex gap-2">
                  <span>•</span> {warning}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Info */}
      {info.length > 0 && (
        <Alert className="border-blue-300 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <ul className="space-y-1 text-sm text-blue-700">
              {info.map((item, idx) => (
                <li key={idx} className="flex gap-2">
                  <span>ℹ️</span> {item}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      {summary && (
        <Card className="bg-slate-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Datensätze</p>
                <p className="text-lg font-bold">{summary.dataCount?.investments || 0 + summary.dataCount?.otherIncomes || 0}</p>
              </div>
              <div>
                <p className="text-slate-600">Status</p>
                <p className="text-lg font-bold">{isValid ? '✅ OK' : '❌ Fehler'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}