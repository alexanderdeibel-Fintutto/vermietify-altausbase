import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkExportDialog({ open, onOpenChange, data, entityType, filename }) {
  const [format, setFormat] = useState('csv');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      if (format === 'csv') {
        exportAsCSV();
      } else if (format === 'excel') {
        exportAsExcel();
      } else if (format === 'json') {
        exportAsJSON();
      }
      
      toast.success('Export erfolgreich');
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Fehler beim Exportieren');
    } finally {
      setExporting(false);
    }
  };

  const exportAsCSV = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csv = [
      includeHeaders ? headers.join(',') : null,
      ...data.map(row => 
        headers.map(h => {
          const val = row[h];
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(',')
      )
    ].filter(Boolean).join('\n');

    downloadFile(csv, `${filename || 'export'}.csv`, 'text/csv');
  };

  const exportAsExcel = () => {
    // Simple tab-separated format (opens in Excel)
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const tsv = [
      includeHeaders ? headers.join('\t') : null,
      ...data.map(row => headers.map(h => row[h]).join('\t'))
    ].filter(Boolean).join('\n');

    downloadFile(tsv, `${filename || 'export'}.xlsx`, 'application/vnd.ms-excel');
  };

  const exportAsJSON = () => {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${filename || 'export'}.json`, 'application/json');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Daten exportieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <strong>{data?.length || 0}</strong> {entityType} zum Export
            </p>
          </div>

          <div>
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    CSV (Excel-kompatibel)
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Excel (.xlsx)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    JSON
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(format === 'csv' || format === 'excel') && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="headers" 
                checked={includeHeaders}
                onCheckedChange={setIncludeHeaders}
              />
              <Label htmlFor="headers" className="cursor-pointer">
                Spaltenüberschriften einschließen
              </Label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleExport}
              disabled={exporting || !data || data.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Exportieren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}