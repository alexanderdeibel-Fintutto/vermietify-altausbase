import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, Loader2, FileText, Table } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ExportOptionsDialog({ submissionIds, open, onOpenChange }) {
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportSubmissionData', {
        submission_ids: submissionIds,
        format
      });

      if (response.data.success) {
        // Download file
        const blob = new Blob([response.data.data], { 
          type: format === 'json' ? 'application/json' : 'text/csv' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.filename;
        a.click();
        
        toast.success('Export erfolgreich');
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Export fehlgeschlagen');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daten exportieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-3 block">Export-Format</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <div>
                      <div className="font-medium">CSV</div>
                      <div className="text-xs text-slate-600">Für Excel & andere Tools</div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Excel</div>
                      <div className="text-xs text-slate-600">Optimiert für Microsoft Excel</div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <div>
                      <div className="font-medium">JSON</div>
                      <div className="text-xs text-slate-600">Vollständige Daten für Entwickler</div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="text-sm text-slate-600 p-3 bg-slate-50 rounded">
            {submissionIds.length} Submissions werden exportiert
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
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