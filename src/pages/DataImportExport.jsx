import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileText, Table, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DataImportExport() {
  const [selectedEntity, setSelectedEntity] = useState('Building');
  const [importFile, setImportFile] = useState(null);
  const [importResults, setImportResults] = useState(null);

  const entities = [
    { value: 'Building', label: 'Objekte' },
    { value: 'Unit', label: 'Einheiten' },
    { value: 'Tenant', label: 'Mieter' },
    { value: 'LeaseContract', label: 'Verträge' },
    { value: 'FinancialItem', label: 'Finanzposten' },
    { value: 'Document', label: 'Dokumente' }
  ];

  const exportMutation = useMutation({
    mutationFn: async ({ entityName, format }) => {
      const items = await base44.entities[entityName].list();
      return { items, format, entityName };
    },
    onSuccess: ({ items, format, entityName }) => {
      if (format === 'json') {
        const dataStr = JSON.stringify(items, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        downloadFile(blob, `${entityName}-export.json`);
      } else if (format === 'csv') {
        const csv = convertToCSV(items);
        const blob = new Blob([csv], { type: 'text/csv' });
        downloadFile(blob, `${entityName}-export.csv`);
      }
      toast.success('Export erfolgreich');
    }
  });

  const importMutation = useMutation({
    mutationFn: async ({ entityName, file }) => {
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResponse.file_url;

      const schema = await base44.entities[entityName].schema();
      
      const extractResponse = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: schema
      });

      if (extractResponse.status === 'success') {
        const dataArray = Array.isArray(extractResponse.output) 
          ? extractResponse.output 
          : [extractResponse.output];
        
        await base44.entities[entityName].bulkCreate(dataArray);
        return { success: true, count: dataArray.length };
      } else {
        throw new Error(extractResponse.details || 'Import fehlgeschlagen');
      }
    },
    onSuccess: (result) => {
      setImportResults({ success: true, count: result.count });
      toast.success(`${result.count} Datensätze importiert`);
    },
    onError: (error) => {
      setImportResults({ success: false, error: error.message });
      toast.error('Import fehlgeschlagen');
    }
  });

  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const handleExport = (format) => {
    exportMutation.mutate({ entityName: selectedEntity, format });
  };

  const handleImport = () => {
    if (!importFile) {
      toast.error('Bitte wählen Sie eine Datei aus');
      return;
    }
    importMutation.mutate({ entityName: selectedEntity, file: importFile });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-slate-900">Daten Import/Export</h1>
        <p className="text-slate-600">Importieren und exportieren Sie Ihre Daten</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
      <Card>
        <CardHeader>
          <CardTitle>Entity-Auswahl</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEntity} onValueChange={setSelectedEntity}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entities.map(entity => (
                <SelectItem key={entity.value} value={entity.value}>
                  {entity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Daten exportieren</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Exportieren Sie {entities.find(e => e.value === selectedEntity)?.label} als JSON oder CSV
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleExport('json')}
                  disabled={exportMutation.isPending}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Als JSON exportieren
                </Button>
                <Button 
                  onClick={() => handleExport('csv')}
                  disabled={exportMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  <Table className="w-4 h-4 mr-2" />
                  Als CSV exportieren
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Daten importieren</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Datei auswählen (CSV, JSON, PDF, PNG, JPG)</Label>
                <Input
                  type="file"
                  accept=".csv,.json,.pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="mt-2"
                />
              </div>
              <Button 
                onClick={handleImport}
                disabled={importMutation.isPending || !importFile}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importieren
              </Button>

              {importResults && (
                <div className={`p-4 rounded-lg ${importResults.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2">
                    {importResults.success ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-900">Import erfolgreich</div>
                          <div className="text-sm text-green-700">
                            {importResults.count} Datensätze wurden importiert
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <div>
                          <div className="font-medium text-red-900">Import fehlgeschlagen</div>
                          <div className="text-sm text-red-700">{importResults.error}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
      <Card>
        <CardHeader>
          <CardTitle>Hinweise</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• CSV/JSON-Dateien sollten die Entity-Struktur entsprechen</li>
            <li>• Bei PDF/Bildern wird KI zur Datenextraktion verwendet</li>
            <li>• Bulk-Import erstellt mehrere Datensätze gleichzeitig</li>
            <li>• Export enthält alle Felder inklusive IDs und Timestamps</li>
          </ul>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}