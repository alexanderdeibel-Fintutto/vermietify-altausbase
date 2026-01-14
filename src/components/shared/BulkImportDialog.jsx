import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DragDropZone from './DragDropZone';

export default function BulkImportDialog({ 
  open, 
  onOpenChange, 
  onImport,
  entityType = 'items',
  acceptedFormats = '.csv,.xlsx,.xls'
}) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const importResult = await onImport(formData);
      setResult(importResult);
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
        imported: 0,
        failed: 0
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            Daten importieren
          </DialogTitle>
          <DialogDescription>
            Importieren Sie {entityType} aus einer CSV- oder Excel-Datei
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!result ? (
            <>
              <DragDropZone
                onFileSelect={handleFileSelect}
                acceptedTypes={acceptedFormats}
                loading={importing}
              />

              {file && !importing && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleImport}
                    disabled={importing}
                    className="flex-1"
                  >
                    {importing ? 'Importiere...' : 'Import starten'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setFile(null)}
                  >
                    Abbrechen
                  </Button>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  💡 Tipps für erfolgreichen Import:
                </p>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>Erste Zeile muss Spaltenüberschriften enthalten</li>
                  <li>Datumsformat: TT.MM.JJJJ oder JJJJ-MM-TT</li>
                  <li>Zahlen mit Punkt als Dezimaltrennzeichen</li>
                  <li>UTF-8 Kodierung für Umlaute</li>
                </ul>
              </div>
            </>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                {result.success ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Import erfolgreich!
                      </h3>
                      <p className="text-slate-600">
                        {result.imported} Einträge wurden erfolgreich importiert
                      </p>
                      {result.failed > 0 && (
                        <Badge variant="outline" className="mt-2 bg-yellow-50 text-yellow-700">
                          {result.failed} Einträge übersprungen
                        </Badge>
                      )}
                    </div>
                    <Button onClick={handleClose} className="w-full">
                      Fertig
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Import fehlgeschlagen
                      </h3>
                      <p className="text-slate-600">{result.error}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setResult(null)}
                      className="w-full"
                    >
                      Erneut versuchen
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}