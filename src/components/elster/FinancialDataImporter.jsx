import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Download, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Progress } from "@/components/ui/progress";

export default function FinancialDataImporter({ buildingId, taxYear, onImportComplete }) {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleImport = async () => {
    if (!buildingId || !taxYear) {
      toast.error('Gebäude und Jahr erforderlich');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const response = await base44.functions.invoke('importFinancialDataForElster', {
        building_id: buildingId,
        tax_year: taxYear
      });

      if (response.data.success) {
        setImportResult(response.data);
        toast.success('Daten erfolgreich importiert');
        onImportComplete?.(response.data.data);
      }
    } catch (error) {
      toast.error('Import fehlgeschlagen');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="w-5 h-5" />
          Finanzdaten importieren
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="text-sm">
            Importiert automatisch Einnahmen und Ausgaben aus dem Finanzsystem
          </AlertDescription>
        </Alert>

        {!importResult ? (
          <Button 
            onClick={handleImport} 
            disabled={importing || !buildingId || !taxYear}
            className="w-full"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Daten jetzt importieren
          </Button>
        ) : (
          <div className="space-y-3">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="p-2 bg-green-50 rounded text-center">
                <div className="font-bold text-green-700">
                  {importResult.summary.income.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </div>
                <div className="text-xs text-green-600">Einnahmen</div>
              </div>
              <div className="p-2 bg-red-50 rounded text-center">
                <div className="font-bold text-red-700">
                  {importResult.summary.expenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </div>
                <div className="text-xs text-red-600">Ausgaben</div>
              </div>
              <div className="p-2 bg-blue-50 rounded text-center">
                <div className={`font-bold ${importResult.summary.result >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  {importResult.summary.result.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </div>
                <div className="text-xs text-blue-600">Ergebnis</div>
              </div>
            </div>

            {/* Data Quality */}
            {importResult.data.data_quality && (
              <div className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Datenqualität</span>
                  <Badge variant={importResult.data.data_quality.level === 'high' ? 'default' : 'secondary'}>
                    {importResult.data.data_quality.score}%
                  </Badge>
                </div>
                <Progress value={importResult.data.data_quality.score} className="h-2 mb-2" />
                <div className="space-y-1">
                  {importResult.data.data_quality.checks.map((check, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      {check.pass ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-yellow-600" />
                      )}
                      <span className={check.pass ? 'text-slate-600' : 'text-yellow-700'}>
                        {check.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="text-xs text-slate-600 text-center">
              {importResult.summary.items} Transaktionen importiert
            </div>

            <Button 
              onClick={handleImport} 
              variant="outline"
              className="w-full"
              size="sm"
            >
              Erneut importieren
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}