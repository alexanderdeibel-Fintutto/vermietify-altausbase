import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BulkExportDialog({ submissions, open, onOpenChange }) {
  const [selected, setSelected] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState('pdf');

  const exportableSubmissions = submissions.filter(s => 
    s.status === 'VALIDATED' || s.status === 'SUBMITTED' || s.status === 'ACCEPTED'
  );

  const handleExport = async () => {
    if (selected.length === 0) {
      toast.error('Bitte mindestens eine Submission auswählen');
      return;
    }

    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportSubmissionsToExcel', {
        submission_ids: selected,
        format
      });

      if (response.data.success) {
        // Download
        const blob = new Blob([response.data.file_data], { 
          type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elster_export_${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();

        toast.success(`${selected.length} Formulare exportiert`);
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Export fehlgeschlagen');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const toggleSelection = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selected.length === exportableSubmissions.length) {
      setSelected([]);
    } else {
      setSelected(exportableSubmissions.map(s => s.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk-Export</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selected.length === exportableSubmissions.length}
                onCheckedChange={toggleAll}
              />
              <span className="text-sm font-medium">Alle auswählen</span>
            </div>
            <Badge variant="outline">
              {selected.length} von {exportableSubmissions.length}
            </Badge>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {exportableSubmissions.map(sub => (
              <div
                key={sub.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50"
                onClick={() => toggleSelection(sub.id)}
              >
                <Checkbox
                  checked={selected.includes(sub.id)}
                  onCheckedChange={() => toggleSelection(sub.id)}
                />
                <FileText className="w-4 h-4 text-slate-400" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{sub.tax_form_type}</div>
                  <div className="text-xs text-slate-500">
                    {sub.tax_year} | {sub.legal_form}
                  </div>
                </div>
                <Badge variant="outline">{sub.status}</Badge>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              disabled={exporting || selected.length === 0}
              className="flex-1"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Als Excel exportieren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}