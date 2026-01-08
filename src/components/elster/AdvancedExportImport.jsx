import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, Upload, FileText, Database, 
  Package, CheckCircle, AlertCircle, Loader2 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdvancedExportImport() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const exportFormats = [
    {
      id: 'datev',
      name: 'DATEV',
      description: 'DATEV-kompatibles Format für Steuerberater',
      icon: FileText,
      format: '.csv'
    },
    {
      id: 'elster-backup',
      name: 'ELSTER Backup',
      description: 'Vollständiges Backup aller ELSTER-Daten',
      icon: Database,
      format: '.zip'
    },
    {
      id: 'tax-office',
      name: 'Finanzamt XML',
      description: 'XML-Export für Finanzamts-Anfragen',
      icon: FileText,
      format: '.xml'
    },
    {
      id: 'excel',
      name: 'Excel Report',
      description: 'Detaillierter Excel-Report mit allen Daten',
      icon: FileText,
      format: '.xlsx'
    }
  ];

  const handleExport = async (formatId) => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('advancedExport', {
        format: formatId,
        year: new Date().getFullYear()
      });

      // Download file
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const format = exportFormats.find(f => f.id === formatId);
      a.download = `elster-export-${formatId}${format.format}`;
      a.click();

      toast.success('Export erfolgreich');
    } catch (error) {
      toast.error('Export fehlgeschlagen');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file) => {
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      // Upload file first
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      
      // Process import
      const importResponse = await base44.functions.invoke('advancedImport', {
        file_url: uploadResponse.file_url,
        file_type: file.name.split('.').pop()
      });

      setImportResult(importResponse.data);
      toast.success('Import erfolgreich');
    } catch (error) {
      toast.error('Import fehlgeschlagen');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Erweiterte Export/Import Funktionen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="mt-4">
            <div className="space-y-3">
              {exportFormats.map(format => {
                const Icon = format.icon;
                return (
                  <div key={format.id} className="p-4 border rounded-lg hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium mb-1">{format.name}</div>
                          <div className="text-sm text-slate-600 mb-2">
                            {format.description}
                          </div>
                          <Badge variant="outline">{format.format}</Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleExport(format.id)}
                        disabled={exporting}
                      >
                        {exporting ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3 mr-1" />
                        )}
                        Export
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="import" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <strong>Unterstützte Formate:</strong> DATEV CSV, Excel (.xlsx), 
                    ELSTER XML, Backup-Dateien (.zip)
                  </div>
                </div>
              </div>

              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 mb-4">
                  Datei hier ablegen oder klicken zum Auswählen
                </p>
                <input
                  type="file"
                  className="hidden"
                  id="import-file"
                  accept=".csv,.xlsx,.xml,.zip"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImport(file);
                  }}
                />
                <Button
                  onClick={() => document.getElementById('import-file')?.click()}
                  disabled={importing}
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Datei auswählen
                </Button>
              </div>

              {importResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Import erfolgreich</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm text-green-600 mb-1">Importiert</div>
                      <div className="text-2xl font-bold text-green-700">
                        {importResult.imported}
                      </div>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm text-yellow-600 mb-1">Übersprungen</div>
                      <div className="text-2xl font-bold text-yellow-700">
                        {importResult.skipped}
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-600 mb-1">Fehler</div>
                      <div className="text-2xl font-bold text-red-700">
                        {importResult.errors}
                      </div>
                    </div>
                  </div>

                  {importResult.details && (
                    <div className="p-3 bg-slate-50 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Details:</div>
                      <div className="text-xs text-slate-600 space-y-1">
                        {importResult.details.map((detail, idx) => (
                          <div key={idx}>{detail}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}