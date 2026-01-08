import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertTriangle, XCircle, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BatchCreateDialog({ open, onOpenChange, onSuccess }) {
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [formType, setFormType] = useState('ANLAGE_V');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleBatchCreate = async () => {
    setProcessing(true);
    setResult(null);

    try {
      const response = await base44.functions.invoke('batchCreateFormsAllBuildings', {
        tax_year: taxYear,
        form_type: formType
      });

      if (response.data.success) {
        setResult(response.data.results);
        toast.success(response.data.message);
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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Batch-Erstellung für alle Gebäude
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Erstellt automatisch Steuerformulare für alle Gebäude im System.
              Existierende Submissions werden übersprungen.
            </AlertDescription>
          </Alert>

          {!result && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Formular-Typ</label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANLAGE_V">Anlage V</SelectItem>
                    <SelectItem value="EUER">EÜR</SelectItem>
                    <SelectItem value="GEWERBESTEUER">Gewerbesteuer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Steuerjahr</label>
                <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3].map(i => {
                      const year = new Date().getFullYear() - 1 - i;
                      return <SelectItem key={year} value={String(year)}>{year}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 bg-slate-50 rounded text-center">
                  <div className="text-2xl font-bold">{result.total}</div>
                  <div className="text-xs text-slate-600">Gesamt</div>
                </div>
                <div className="p-3 bg-green-50 rounded text-center">
                  <div className="text-2xl font-bold text-green-700">{result.created}</div>
                  <div className="text-xs text-green-600">Erstellt</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded text-center">
                  <div className="text-2xl font-bold text-yellow-700">{result.skipped}</div>
                  <div className="text-xs text-yellow-600">Übersprungen</div>
                </div>
                <div className="p-3 bg-red-50 rounded text-center">
                  <div className="text-2xl font-bold text-red-700">{result.errors}</div>
                  <div className="text-xs text-red-600">Fehler</div>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {result.details.map((detail, idx) => (
                  <div key={idx} className="p-2 border rounded text-sm flex items-center gap-2">
                    {detail.status === 'created' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {detail.status === 'skipped' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                    {detail.status === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                    <span className="flex-1">{detail.building_name}</span>
                    <Badge variant={
                      detail.status === 'created' ? 'default' :
                      detail.status === 'skipped' ? 'secondary' : 'destructive'
                    }>
                      {detail.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleBatchCreate} disabled={processing}>
                {processing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Jetzt erstellen
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}