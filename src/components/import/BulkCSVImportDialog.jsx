import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { trackFeatureUsage } from '@/components/analytics/FeatureUsageTracker';

const ENTITY_TEMPLATES = {
  Invoice: {
    fields: ['invoice_date', 'amount', 'recipient', 'description', 'type', 'status'],
    required: ['invoice_date', 'amount', 'description'],
    example: 'invoice_date,amount,recipient,description,type,status\n2024-01-15,150.50,Stadtwerke,Strom Januar,expense,paid'
  },
  Tenant: {
    fields: ['first_name', 'last_name', 'email', 'phone', 'date_of_birth'],
    required: ['first_name', 'last_name'],
    example: 'first_name,last_name,email,phone,date_of_birth\nMax,Mustermann,max@example.com,0171123456,1990-05-15'
  },
  Unit: {
    fields: ['unit_number', 'sqm', 'rooms', 'floor', 'status', 'gebaeude_id'],
    required: ['unit_number', 'gebaeude_id'],
    example: 'unit_number,sqm,rooms,floor,status,gebaeude_id\nWE-01,65.5,3,1,vacant,building_id_here'
  }
};

export default function BulkCSVImportDialog({ open, onOpenChange, entityType, onSuccess }) {
  const [file, setFile] = useState(null);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [step, setStep] = useState(1); // 1: upload, 2: mapping, 3: import

  const template = ENTITY_TEMPLATES[entityType];

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      
      if (lines.length < 2) {
        toast.error('CSV muss mindestens Header + 1 Zeile enthalten');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1, 6).map(line => 
        line.split(',').map(v => v.trim())
      );

      setPreview({
        headers,
        rows: dataRows
      });

      // Auto-map if headers match
      const autoMapping = {};
      headers.forEach((header, index) => {
        if (template.fields.includes(header)) {
          autoMapping[header] = index;
        }
      });
      setMapping(autoMapping);

      setFile(uploadedFile);
      setStep(2);
    };

    reader.readAsText(uploadedFile);
  };

  const handleImport = async () => {
    if (Object.keys(mapping).length === 0) {
      toast.error('Bitte mindestens ein Feld zuordnen');
      return;
    }

    // Check required fields
    const missingRequired = template.required.filter(req => !mapping[req]);
    if (missingRequired.length > 0) {
      toast.error(`Pflichtfelder fehlen: ${missingRequired.join(', ')}`);
      return;
    }

    setImporting(true);
    setStep(3);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const dataRows = lines.slice(1);

        const imported = [];
        const failed = [];

        for (let i = 0; i < dataRows.length; i++) {
          const values = dataRows[i].split(',').map(v => v.trim());
          const record = {};

          Object.entries(mapping).forEach(([field, columnIndex]) => {
            record[field] = values[columnIndex];
          });

          try {
            await base44.entities[entityType].create(record);
            imported.push(record);
          } catch (error) {
            failed.push({ record, error: error.message });
          }

          setProgress(((i + 1) / dataRows.length) * 100);
        }

        setResults({ imported: imported.length, failed: failed.length, errors: failed });
        trackFeatureUsage.dataImported(entityType, imported.length, failed.length === 0);
        
        if (failed.length === 0) {
          toast.success(`${imported.length} Datensätze importiert`);
        } else {
          toast.warning(`${imported.length} importiert, ${failed.length} fehlgeschlagen`);
        }

        onSuccess?.();
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Fehler beim Import');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([template.example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            CSV/Excel Import - {entityType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Upload */}
          {step === 1 && (
            <>
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Noch keine Vorlage? Laden Sie ein Beispiel herunter:</span>
                    <Button variant="outline" size="sm" onClick={downloadTemplate}>
                      <Download className="w-4 h-4 mr-2" />
                      Template herunterladen
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-slate-400 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-sm text-slate-600 mb-2">CSV oder Excel Datei hochladen</p>
                  <p className="text-xs text-slate-500">Unterstützte Formate: .csv, .xlsx, .xls</p>
                </label>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Erforderliche Felder:</p>
                <div className="flex flex-wrap gap-2">
                  {template.required.map(field => (
                    <Badge key={field} variant="outline" className="bg-white">
                      {field} *
                    </Badge>
                  ))}
                </div>
                <p className="text-sm font-medium mt-3 mb-2">Optionale Felder:</p>
                <div className="flex flex-wrap gap-2">
                  {template.fields.filter(f => !template.required.includes(f)).map(field => (
                    <Badge key={field} variant="outline">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Field Mapping */}
          {step === 2 && preview && (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ordnen Sie die CSV-Spalten den Datenbankfeldern zu. Vorschau der ersten 5 Zeilen:
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {template.fields.map(field => (
                  <div key={field} className="grid grid-cols-2 gap-4 items-center">
                    <Label className="flex items-center gap-2">
                      {field}
                      {template.required.includes(field) && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    <Select
                      value={mapping[field]?.toString() || ''}
                      onValueChange={(value) => setMapping({...mapping, [field]: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Spalte wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {preview.headers.map((header, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {header} (Spalte {index + 1})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <Card className="p-4 bg-slate-50">
                <p className="text-sm font-medium mb-2">Vorschau (erste 5 Zeilen):</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        {preview.headers.map((h, i) => (
                          <th key={i} className="text-left p-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, i) => (
                        <tr key={i} className="border-b">
                          {row.map((cell, j) => (
                            <td key={j} className="p-2">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* Step 3: Import Progress */}
          {step === 3 && (
            <div className="space-y-4">
              {importing ? (
                <>
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <p className="text-sm">Importiere Datensätze...</p>
                  </div>
                  <Progress value={progress} />
                  <p className="text-xs text-slate-500 text-center">{Math.round(progress)}% abgeschlossen</p>
                </>
              ) : results && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Import abgeschlossen</p>
                      <p className="text-sm text-green-700">{results.imported} Datensätze erfolgreich importiert</p>
                    </div>
                  </div>

                  {results.failed > 0 && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="font-medium text-red-900 mb-2">{results.failed} fehlgeschlagen</p>
                      <div className="space-y-1 text-xs text-red-700 max-h-40 overflow-y-auto">
                        {results.errors.map((err, idx) => (
                          <p key={idx}>• {err.error}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      setStep(1);
                      setFile(null);
                      setPreview([]);
                      setMapping({});
                      setResults(null);
                      onOpenChange(false);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Schließen
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          {step === 2 && (
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(1)}>
                Zurück
              </Button>
              <Button onClick={handleImport} className="bg-emerald-600 hover:bg-emerald-700">
                <Upload className="w-4 h-4 mr-2" />
                Jetzt importieren
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}