import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BatchOperationsPanel({ submissions }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const draftSubmissions = submissions.filter(s => s.status === 'DRAFT' || s.status === 'AI_PROCESSED');

  const handleToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(draftSubmissions.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBatchValidate = async () => {
    if (selectedIds.length === 0) {
      toast.error('Keine Submissions ausgewählt');
      return;
    }

    setIsValidating(true);
    try {
      const response = await base44.functions.invoke('batchValidateSubmissions', {
        submission_ids: selectedIds
      });

      if (response.data.success) {
        toast.success(`${response.data.validated} von ${response.data.total} validiert`);
        setSelectedIds([]);
      }
    } catch (error) {
      toast.error('Batch-Validierung fehlgeschlagen');
    } finally {
      setIsValidating(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await base44.functions.invoke('exportSubmissionsToExcel', {
        submission_ids: selectedIds.length > 0 ? selectedIds : null
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'elster_export.csv';
      a.click();
      
      toast.success('Excel exportiert');
    } catch (error) {
      toast.error('Export fehlgeschlagen');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Batch-Operationen</CardTitle>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.length === draftSubmissions.length && draftSubmissions.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm">Alle Draft auswählen</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-60 overflow-y-auto space-y-2">
          {draftSubmissions.length === 0 ? (
            <p className="text-center text-slate-500 py-4">
              Keine Draft-Submissions vorhanden
            </p>
          ) : (
            draftSubmissions.map(sub => (
              <div key={sub.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                <Checkbox
                  checked={selectedIds.includes(sub.id)}
                  onCheckedChange={() => handleToggle(sub.id)}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{sub.tax_form_type}</div>
                  <div className="text-xs text-slate-600">Jahr: {sub.tax_year}</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {sub.status}
                </Badge>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2 pt-4 border-t">
          <Button
            onClick={handleBatchValidate}
            disabled={isValidating || selectedIds.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isValidating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {selectedIds.length > 0 ? `${selectedIds.length} validieren` : 'Submissions validieren'}
          </Button>

          <Button
            onClick={handleExportExcel}
            disabled={isExporting}
            variant="outline"
            className="w-full"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            {selectedIds.length > 0 ? `${selectedIds.length} als Excel` : 'Alle als Excel'}
          </Button>
        </div>

        {selectedIds.length > 0 && (
          <div className="text-xs text-slate-600 text-center">
            {selectedIds.length} Submission(s) ausgewählt
          </div>
        )}
      </CardContent>
    </Card>
  );
}