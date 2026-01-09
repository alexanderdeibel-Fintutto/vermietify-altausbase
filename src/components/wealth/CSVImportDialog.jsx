import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { BROKER_MAPPINGS, detectBrokerFromCSVHeaders } from './brokerMappings';

export default function CSVImportDialog({ open, onOpenChange, onImport, isLoading }) {
  const [selectedTab, setSelectedTab] = useState('broker-select');
  const [selectedBroker, setSelectedBroker] = useState('');
  const [csvFile, setCSVFile] = useState(null);
  const [csvPreview, setCSVPreview] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [results, setResults] = useState(null);

  const handleBrokerSelect = (brokerKey) => {
    setSelectedBroker(brokerKey);
    setSelectedTab('file-upload');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCSVFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const lines = content.split('\n').map(line => line.split(','));
      
      if (!selectedBroker) {
        const detected = detectBrokerFromCSVHeaders(lines[0]);
        if (detected) {
          setSelectedBroker(detected);
        }
      }

      setCSVPreview({
        headers: lines[0],
        rows: lines.slice(1, 6),
        totalRows: lines.length - 1
      });
      
      setSelectedTab('column-mapping');
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (!csvFile || !selectedBroker) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const response = await fetch('/api/functions/importAssetPortfolioCSV', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_content: event.target.result,
            broker_key: selectedBroker,
            column_mapping: columnMapping
          })
        });

        const result = await response.json();
        
        setResults({
          success_count: result.success_count || 0,
          total_rows: result.total_rows || 0,
          error_count: result.error_count || 0,
          warning_count: result.warning_count || 0,
          errors: result.errors || [],
          batch_id: result.batch_id,
          message: result.message
        });
        
        setSelectedTab('import-results');
        onImport?.(result);
      } catch (error) {
        setResults({
          success_count: 0,
          errors: [{ row: 'system', message: error.message }],
          batch_id: null
        });
        setSelectedTab('import-results');
      }
    };
    
    reader.readAsText(csvFile);
  };

  const brokerOptions = Object.entries(BROKER_MAPPINGS).map(([key, mapping]) => ({
    key,
    ...mapping
  }));

  const brokerMapping = selectedBroker ? BROKER_MAPPINGS[selectedBroker] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Depot-Auszug importieren</DialogTitle>
          <DialogDescription>
            CSV-Datei von Ihrem Broker automatisch importieren
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="broker-select" disabled={results !== null}>Broker</TabsTrigger>
            <TabsTrigger value="file-upload" disabled={!selectedBroker || results !== null}>Datei</TabsTrigger>
            <TabsTrigger value="column-mapping" disabled={!csvPreview || results !== null}>Spalten</TabsTrigger>
            <TabsTrigger value="import-results" disabled={results === null}>Ergebnis</TabsTrigger>
          </TabsList>

          <TabsContent value="broker-select" className="space-y-4 py-6">
            <p className="text-sm text-slate-600">Wählen Sie Ihren Broker:</p>
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {brokerOptions.map(broker => (
                <Card
                  key={broker.key}
                  className={`cursor-pointer transition-all ${selectedBroker === broker.key ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:ring-2 hover:ring-slate-300'}`}
                  onClick={() => handleBrokerSelect(broker.key)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-light text-slate-900">{broker.display_name}</h4>
                    <p className="text-xs text-slate-500 mt-2">
                      Format: {broker.date_format}<br/>
                      Trenner: {broker.decimal_separator === ',' ? 'Komma' : 'Punkt'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="file-upload" className="space-y-4 py-6">
            <Label className="text-sm font-light">CSV-Datei hochladen</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer block">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-light text-slate-600">
                  CSV-Datei von {brokerMapping?.display_name || 'Ihrem Broker'} hochladen
                </p>
              </label>
            </div>

            {csvPreview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-light">
                    Vorschau ({csvPreview.totalRows} Zeilen)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          {csvPreview.headers.map((header, idx) => (
                            <th key={idx} className="text-left py-2 px-2 font-light text-slate-600">
                              {header.trim()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.rows.slice(0, 3).map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b hover:bg-slate-50">
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="py-2 px-2 text-slate-900 font-light">
                                {cell.trim()}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="column-mapping" className="space-y-4 py-6">
            <p className="text-sm text-slate-600">Spalten-Zuordnung:</p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {['asset_name', 'isin', 'date', 'quantity', 'price'].map(field => (
                <div key={field} className="flex items-center gap-4">
                  <Label className="w-40 text-sm font-light">{field}</Label>
                  <Select
                    value={columnMapping[field] || ''}
                    onValueChange={(value) =>
                      setColumnMapping(prev => ({ ...prev, [field]: value }))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Spalte wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {csvPreview?.headers.map((header, idx) => (
                        <SelectItem key={idx} value={header.trim()}>
                          {header.trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="import-results" className="space-y-4 py-6">
            {results && (
              <>
                {results.success_count > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-light text-green-900">
                        ✓ {results.success_count} von {results.total_rows} Positionen erfolgreich importiert
                      </p>
                      <p className="text-xs text-green-700 font-light">
                        Batch ID: {results.batch_id}
                      </p>
                    </div>
                  </div>
                )}

                {results.error_count > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {results.error_count} Fehler beim Import
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
                        {results.errors.map((error, idx) => (
                          <div key={idx} className="text-red-600 p-2 bg-red-100 rounded">
                            {error.row === 'system' ? 'Import-Fehler' : `Zeile ${error.row}`}: {error.message}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="font-light"
          >
            Abbrechen
          </Button>

          {selectedTab !== 'import-results' && (
            <Button
              onClick={() => {
                if (selectedTab === 'column-mapping') {
                  handleImportSubmit();
                }
              }}
              disabled={!selectedBroker || (selectedTab === 'column-mapping' && !csvFile) || isLoading}
              className="bg-slate-900 hover:bg-slate-800 font-light"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedTab === 'column-mapping' ? 'Importieren' : 'Weiter'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}