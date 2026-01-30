import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const IMPORT_TEMPLATES = {
  buildings: { label: 'Gebäude', fields: ['name', 'address', 'city', 'zip_code', 'units_count'] },
  tenants: { label: 'Mieter', fields: ['first_name', 'last_name', 'email', 'phone', 'unit_id'] },
  contracts: { label: 'Verträge', fields: ['tenant_id', 'unit_id', 'start_date', 'end_date', 'rent_amount'] }
};

export default function BulkImportDialog({ open, onOpenChange, entityType, onImport }) {
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState(null);

  const template = IMPORT_TEMPLATES[entityType];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };

  const downloadTemplate = () => {
    const headers = template.fields.join(',');
    const example = template.fields.map(() => 'Beispiel').join(',');
    const csv = `${headers}\n${example}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}_vorlage.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const rows = text.split('\n').filter(r => r.trim());
      const headers = rows[0].split(',');
      
      const data = rows.slice(1).map(row => {
        const values = row.split(',');
        return headers.reduce((obj, header, idx) => {
          obj[header.trim()] = values[idx]?.trim();
          return obj;
        }, {});
      });

      const importResult = await onImport(data);
      setResult({
        success: true,
        imported: data.length,
        errors: []
      });
    } catch (error) {
      setResult({
        success: false,
        errors: [error.message]
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {template?.label} importieren
          </DialogTitle>
          <DialogDescription>
            Laden Sie eine CSV-Datei hoch um mehrere Einträge gleichzeitig zu importieren
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100 mb-3">
              Laden Sie zuerst die Vorlage herunter und füllen Sie Ihre Daten aus
            </p>
            <Button variant="outline" onClick={downloadTemplate} className="gap-2 w-full">
              <Download className="w-4 h-4" />
              CSV-Vorlage herunterladen
            </Button>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" className="gap-2" asChild>
                <span>
                  <Upload className="w-4 h-4" />
                  CSV-Datei auswählen
                </span>
              </Button>
            </label>
            {file && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                {file.name}
              </p>
            )}
          </div>

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                result.success
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">
                    {result.success ? 'Import erfolgreich!' : 'Import fehlgeschlagen'}
                  </p>
                  {result.success ? (
                    <p className="text-sm">{result.imported} Einträge importiert</p>
                  ) : (
                    <ul className="text-sm space-y-1">
                      {result.errors.map((err, idx) => (
                        <li key={idx}>• {err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="gap-2"
          >
            {isImporting ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Upload className="w-4 h-4" />
                </motion.div>
                Importiert...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importieren
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}