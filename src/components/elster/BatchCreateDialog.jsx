import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function BatchCreateDialog({ open, onOpenChange, onSuccess }) {
  const [formType, setFormType] = useState('');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleBatchCreate = async () => {
    if (!formType) {
      toast.error('Bitte Formular-Typ auswählen');
      return;
    }

    setProcessing(true);
    setResults(null);

    try {
      const response = await base44.functions.invoke('batchCreateFormsAllBuildings', {
        form_type: formType,
        tax_year: taxYear
      });

      if (response.data.success) {
        setResults(response.data);
        toast.success(`${response.data.success_count} Formulare erstellt`);
        onSuccess?.();
      }
    } catch (error) {
      toast.error('Batch-Erstellung fehlgeschlagen');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Formulare für alle Gebäude erstellen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              Erstellt automatisch Formulare mit KI für alle Ihre Gebäude
            </AlertDescription>
          </Alert>

          <div>
            <Label>Formular-Typ</Label>
            <Select value={formType} onValueChange={setFormType}>
              <SelectTrigger>
                <SelectValue placeholder="Typ wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANLAGE_V">Anlage V - Vermietung & Verpachtung</SelectItem>
                <SelectItem value="EUER">EÜR - Einnahmen-Überschuss-Rechnung</SelectItem>
                <SelectItem value="GEWERBESTEUER">Gewerbesteuererklärung</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Steuerjahr</Label>
            <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...Array(3)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <SelectItem key={year} value={String(year)}>{year}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>

          {results && (
            <div className="pt-3 border-t">
              <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                <div className="p-2 bg-green-50 rounded text-center">
                  <div className="font-bold text-green-700">{results.success_count}</div>
                  <div className="text-xs text-green-600">Erfolgreich</div>
                </div>
                <div className="p-2 bg-yellow-50 rounded text-center">
                  <div className="font-bold text-yellow-700">{results.skip_count}</div>
                  <div className="text-xs text-yellow-600">Übersprungen</div>
                </div>
                <div className="p-2 bg-red-50 rounded text-center">
                  <div className="font-bold text-red-700">{results.fail_count}</div>
                  <div className="text-xs text-red-600">Fehler</div>
                </div>
              </div>

              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {results.results.map((result, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex items-center gap-2">
                        {result.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : result.status === 'skipped' ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span>{result.building_name}</span>
                      </div>
                      {result.confidence && (
                        <span className="text-xs text-slate-600">{result.confidence}% KI</span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {results ? 'Schließen' : 'Abbrechen'}
            </Button>
            {!results && (
              <Button
                onClick={handleBatchCreate}
                disabled={processing || !formType}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Batch-Erstellung starten
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}