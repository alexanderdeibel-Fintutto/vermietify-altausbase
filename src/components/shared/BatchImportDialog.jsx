import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, FileUp } from 'lucide-react';
import DragDropZone from './DragDropZone';
import ProgressIndicatorBar from './ProgressIndicatorBar';

export default function BatchImportDialog({ 
  open, 
  onOpenChange,
  onImport,
  title = 'Daten importieren',
  description = 'Laden Sie eine CSV- oder JSON-Datei hoch'
}) {
  const [files, setFiles] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    if (files.length === 0) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = async (e) => {
        setProgress(50);
        
        try {
          let data;
          if (file.name.endsWith('.json')) {
            data = JSON.parse(e.target.result);
          } else if (file.name.endsWith('.csv')) {
            data = parseCSV(e.target.result);
          }

          await onImport(Array.isArray(data) ? data : [data]);
          setProgress(100);
          setResult({ success: true, count: Array.isArray(data) ? data.length : 1 });
          setTimeout(() => onOpenChange(false), 1500);
        } catch (error) {
          setResult({ success: false, error: error.message });
        }
      };

      reader.readAsText(file);
    } finally {
      setImporting(false);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, i) => {
        obj[header] = values[i]?.trim() || '';
        return obj;
      }, {});
    }).filter(row => Object.values(row).some(v => v));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {result ? (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${result.success ? 'text-emerald-900' : 'text-red-900'}`}>
                    {result.success ? `${result.count} Einträge importiert` : 'Fehler beim Import'}
                  </p>
                  {result.error && <p className="text-xs text-red-700 mt-1">{result.error}</p>}
                </div>
              </div>
            </div>
          ) : (
            <>
              <DragDropZone
                onFilesSelect={setFiles}
                accept=".csv,.json"
                maxFiles={1}
              />

              {importing && (
                <ProgressIndicatorBar
                  current={progress}
                  total={100}
                  label="Wird importiert..."
                  animated
                />
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={files.length === 0 || importing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <FileUp className="w-4 h-4" />
                  Importieren
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Abbrechen
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}