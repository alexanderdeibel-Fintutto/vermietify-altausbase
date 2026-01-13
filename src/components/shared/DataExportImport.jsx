import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Upload, FileJson } from 'lucide-react';
import { toast } from 'sonner';

export default function DataExportImport({ data, filename, dataType }) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Daten exportiert');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result);
        console.log('Importierte Daten:', imported);
        toast.success(`${dataType} importiert`);
        setImportDialogOpen(false);
      } catch (error) {
        toast.error('Fehler beim Importieren der Datei');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleExport}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Export JSON
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setImportDialogOpen(true)}
        className="gap-2"
      >
        <Upload className="w-4 h-4" />
        Import
      </Button>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daten importieren</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileJson className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-600 mb-3">JSON-Datei hochladen</p>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button 
                asChild
                className="w-full"
              >
                <label htmlFor="import-file" className="cursor-pointer">
                  Datei auswählen
                </label>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}