import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, CheckCircle, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ExcelImportDialog({ open, onOpenChange, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [buildingId, setBuildingId] = useState('');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const downloadTemplate = () => {
    const template = `Kategorie,Betrag,Beschreibung
Mieteinnahmen,12000.00,Jahresmiete
Grundsteuer,800.00,Grundsteuer 2024
Versicherung,450.00,Gebäudeversicherung
Instandhaltung,1500.00,Reparaturen
Verwaltung,600.00,Hausverwaltung
AfA,4000.00,Abschreibung`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elster_import_template.csv';
    a.click();
  };

  const handleImport = async () => {
    if (!file || !buildingId) {
      toast.error('Bitte Datei und Gebäude auswählen');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('building_id', buildingId);
      formData.append('tax_year', taxYear);

      const response = await base44.functions.invoke('importFinancialDataFromExcel', formData);

      if (response.data.success) {
        setResult(response.data);
        toast.success(response.data.message);
        onImportSuccess?.(response.data.form_data);
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

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Importieren Sie Ihre Finanzdaten aus einer Excel/CSV-Datei. Die Daten werden automatisch den passenden Kategorien zugeordnet.
            </AlertDescription>
          </Alert>

          <Button onClick={downloadTemplate} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            CSV-Template herunterladen
          </Button>

          <div>
            <Label>Steuerjahr</Label>
            <Input
              type="number"
              value={taxYear}
              onChange={(e) => setTaxYear(parseInt(e.target.value))}
              min={2020}
              max={new Date().getFullYear()}
            />
          </div>

          <div>
            <Label>Gebäude-ID</Label>
            <Input
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value)}
              placeholder="Gebäude-ID eingeben"
            />
          </div>

          <div>
            <Label>Excel/CSV-Datei</Label>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </div>

          <Button
            onClick={handleImport}
            disabled={importing || !file || !buildingId}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {importing ? 'Wird importiert...' : 'Importieren'}
          </Button>

          {result && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <div className="font-medium mb-2">Import erfolgreich!</div>
                <div className="text-sm space-y-1">
                  <div>Importierte Zeilen: {result.imported_rows}</div>
                  <div className="mt-2 p-2 bg-white rounded border text-xs">
                    <div>Mieteinnahmen: {result.form_data.income_rent.toLocaleString('de-DE')} €</div>
                    <div>Grundsteuer: {result.form_data.expense_property_tax.toLocaleString('de-DE')} €</div>
                    <div>Versicherungen: {result.form_data.expense_insurance.toLocaleString('de-DE')} €</div>
                    <div>Instandhaltung: {result.form_data.expense_maintenance.toLocaleString('de-DE')} €</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}