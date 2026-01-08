import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download, FileJson, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DataImportExportPage() {
  const [importFile, setImportFile] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate import
      console.log('Importing:', file.name);
      setImportFile(file);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    // Simulate export
    setTimeout(() => {
      setExporting(false);
      console.log('Exported as', format);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">📊 Datenimport/Export</h1>
        <p className="text-slate-600 mt-1">Importieren und exportieren Sie Ihre Daten in verschiedenen Formaten</p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Sichern Sie Ihre Daten regelmäßig. Importe können bestehende Daten überschreiben.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> Daten importieren</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Input 
                type="file" 
                accept=".csv,.json,.xlsx" 
                onChange={handleImport}
                className="hidden" 
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <FileJson className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">CSV, JSON oder Excel hochladen</p>
                <p className="text-xs text-slate-500 mt-1">oder zum Hochladen klicken</p>
              </label>
            </div>
            {importFile && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">✓ {importFile.name} ausgewählt</p>
              </div>
            )}
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={!importFile}>
              Importieren
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Download className="w-5 h-5" /> Daten exportieren</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button onClick={() => handleExport('CSV')} className="w-full bg-slate-600 hover:bg-slate-700" disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Wird exportiert...' : 'Als CSV exportieren'}
              </Button>
              <Button onClick={() => handleExport('JSON')} className="w-full bg-slate-600 hover:bg-slate-700" disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Wird exportiert...' : 'Als JSON exportieren'}
              </Button>
              <Button onClick={() => handleExport('Excel')} className="w-full bg-slate-600 hover:bg-slate-700" disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Wird exportiert...' : 'Als Excel exportieren'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unterstützte Datentypen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {['Gebäude', 'Wohneinheiten', 'Mieter', 'Verträge', 'Zahlungen', 'Finanzbuchungen'].map((type, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-semibold text-slate-900">{type}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}