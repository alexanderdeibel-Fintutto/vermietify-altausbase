import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, CheckSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";

export default function BulkExportButton({ submissions }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState('json');
  const [selectedIds, setSelectedIds] = useState([]);
  const [exporting, setExporting] = useState(false);

  const handleToggleAll = () => {
    if (selectedIds.length === submissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(submissions.map(s => s.id));
    }
  };

  const handleToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      toast.error('Keine Submissions ausgewählt');
      return;
    }

    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportSubmissionData', {
        submission_ids: selectedIds,
        format
      });

      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `elster_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success(`${selectedIds.length} Submissions exportiert`);
      setOpen(false);
      setSelectedIds([]);
    } catch (error) {
      toast.error('Export fehlgeschlagen');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Bulk Export
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submissions exportieren</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Format</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Submissions auswählen</span>
                <Button variant="ghost" size="sm" onClick={handleToggleAll}>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  {selectedIds.length === submissions.length ? 'Keine' : 'Alle'}
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 border rounded p-2">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => handleToggle(sub.id)}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedIds.includes(sub.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'
                    } border`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{sub.tax_form_type}</div>
                        <div className="text-xs text-slate-600">Jahr: {sub.tax_year}</div>
                      </div>
                      <Badge variant={selectedIds.includes(sub.id) ? 'default' : 'outline'}>
                        {sub.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-slate-600 mt-2">
                {selectedIds.length} von {submissions.length} ausgewählt
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleExport} disabled={exporting || selectedIds.length === 0}>
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Exportieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}