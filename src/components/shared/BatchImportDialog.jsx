import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import DragDropZone from './DragDropZone';
import ProgressIndicatorBar from './ProgressIndicatorBar';

export default function BatchImportDialog({ 
  open, 
  onOpenChange,
  entityType,
  onImport,
  steps = [
    { label: 'Datei hochladen' },
    { label: 'Vorschau' },
    { label: 'Importieren' }
  ]
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    
    // Parse preview
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(';');
        const rows = lines.slice(1, 6).map(line => {
          const values = line.split(';');
          return headers.reduce((obj, header, idx) => {
            obj[header] = values[idx] || '';
            return obj;
          }, {});
        });
        
        setPreview({ headers, rows, totalRows: lines.length - 1 });
        setCurrentStep(1);
      } catch (error) {
        console.error('Preview error:', error);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    setCurrentStep(2);
    setImporting(true);
    setProgress(0);

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const importResult = await onImport(file);
      
      clearInterval(interval);
      setProgress(100);
      setResult(importResult);
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setFile(null);
    setPreview(null);
    setResult(null);
    setProgress(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Import - {entityType}</DialogTitle>
        </DialogHeader>

        <ProgressIndicatorBar steps={steps} currentStep={currentStep} />

        <div className="space-y-6">
          {/* Step 1: Upload */}
          {currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <DragDropZone
                onFileSelect={handleFileSelect}
                acceptedTypes=".csv,.xlsx,.xls"
              />
            </motion.div>
          )}

          {/* Step 2: Preview */}
          {currentStep === 1 && preview && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">
                  📊 {preview.totalRows} Einträge gefunden
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Vorschau der ersten 5 Zeilen:
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      {preview.headers.map((header, idx) => (
                        <th key={idx} className="text-left p-2 font-semibold text-slate-700">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        {preview.headers.map((header, colIdx) => (
                          <td key={colIdx} className="p-2 text-slate-600">
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleImport} className="flex-1">
                  Import starten <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(0)}>
                  Zurück
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Import Progress/Result */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {importing && (
                <div className="text-center py-8 space-y-4">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-slate-600">
                    Importiere Daten... {progress}%
                  </p>
                </div>
              )}

              {result && (
                <div className="text-center py-8 space-y-4">
                  {result.success ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Import erfolgreich!
                        </h3>
                        <p className="text-slate-600 mt-2">
                          {result.imported || preview?.totalRows} Einträge importiert
                        </p>
                      </div>
                      <Button onClick={handleClose}>Fertig</Button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Import fehlgeschlagen
                        </h3>
                        <p className="text-slate-600 mt-2">{result.error}</p>
                      </div>
                      <Button variant="outline" onClick={() => setCurrentStep(0)}>
                        Erneut versuchen
                      </Button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}