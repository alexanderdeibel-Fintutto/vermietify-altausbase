import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ExcelImportDialog({ buildingId, taxYear, open, onOpenChange, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Bitte Datei auswählen');
      return;
    }

    setImporting(true);
    try {
      // 1. Datei hochladen
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });

      // 2. Finanzdaten extrahieren und importieren
      const importResponse = await base44.functions.invoke('importFinancialDataFromExcel', {
        file_url: uploadResponse.file_url,
        building_id: buildingId,
        tax_year: taxYear || new Date().getFullYear()
      });

      if (importResponse.data.success) {
        setResult(importResponse.data);
        toast.success(`${importResponse.data.imported_count} Einträge importiert`);
        onImportSuccess?.(importResponse.data);
      }
    } catch (error) {
      toast.error('Import fehlgeschlagen');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finanzdaten aus Excel importieren</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div>
              <Label>Excel-Datei (.xlsx, .csv)</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
            </div>

            <div className="text-sm text-slate-600">
              <p className="font-medium mb-1">Erwartetes Format:</p>
              <ul className="list-disc list-inside text-xs">
                <li>Spalten: Datum, Beschreibung, Betrag, Kategorie (optional)</li>
                <li>Datum im Format: TT.MM.JJJJ oder JJJJ-MM-TT</li>
                <li>Betrag als Zahl (Komma oder Punkt)</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={importing || !file} className="flex-1">
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importiere...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importieren
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-green-600">{result.imported_count}</div>
              <div className="text-sm text-slate-600">Einträge erfolgreich importiert</div>
            </div>

            {result.failed_count > 0 && (
              <div className="p-3 bg-red-50 rounded">
                <div className="font-medium text-red-900">{result.failed_count} Fehler</div>
                <div className="text-xs text-red-700 mt-1">
                  Einige Zeilen konnten nicht importiert werden
                </div>
              </div>
            )}

            <Button onClick={() => onOpenChange(false)} className="w-full">
              Schließen
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}