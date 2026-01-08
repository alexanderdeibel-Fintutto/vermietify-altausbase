import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, CheckCircle, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CategoryImportDialog({ open, onOpenChange, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) {
      toast.error('Bitte CSV-Datei auswählen');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await base44.functions.invoke('importCategoriesFromCSV', formData);

      if (response.data.success) {
        setResult(response.data);
        toast.success(response.data.message);
        onSuccess?.();
      }
    } catch (error) {
      toast.error('Import fehlgeschlagen');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `category_code,display_name,legal_forms,tax_treatment,allocatable,skr03_account,skr04_account,description,keywords,examples
GBR_GRUNDSTEUER,Grundsteuer,"[""GBR"",""PRIVATPERSON""]",SOFORT,true,7310,6865,Grundsteuer für vermietete Immobilien,"[""grundsteuer"",""steuerbescheid""]","[""Grundsteuerbescheid 2024""]"
GBR_VERSICHERUNG,Gebäudeversicherung,"[""GBR"",""PRIVATPERSON""]",SOFORT,true,7320,6870,Versicherungen für das Gebäude,"[""versicherung"",""gebäudeversicherung""]","[""Wohngebäudeversicherung""]"
GBR_INSTANDHALTUNG,Instandhaltung,"[""GBR"",""PRIVATPERSON""]",SOFORT,true,7330,6875,Reparatur und Instandhaltung,"[""reparatur"",""instandhaltung""]","[""Dachreparatur"",""Heizungswartung""]"`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kategorien_template.csv';
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kategorien aus CSV importieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Importieren Sie Ihre Kostenkategorien aus einer CSV-Datei. Die Datei muss die korrekten Spalten enthalten.
            </AlertDescription>
          </Alert>

          <Button onClick={downloadTemplate} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            CSV-Template herunterladen
          </Button>

          <div>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading || !file}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? 'Wird importiert...' : 'CSV importieren'}
          </Button>

          {result && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>{result.imported}</strong> von {result.total} Kategorien importiert
                {result.errors && <div className="text-xs mt-1">Fehler: {result.errors.length}</div>}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}