import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Download, Loader2, FileArchive } from 'lucide-react';

export default function BulkFormExport({ submissions }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(submissions.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkExport = async () => {
    if (selectedIds.length === 0) {
      toast.error('Keine Formulare ausgewählt');
      return;
    }

    setIsExporting(true);
    try {
      // Für jede Submission PDF generieren
      const pdfs = [];
      
      for (const id of selectedIds) {
        const response = await base44.functions.invoke('exportTaxFormPDF', { 
          submission_id: id 
        });
        pdfs.push(response.data);
      }

      toast.success(`${pdfs.length} PDFs exportiert`);
      setSelectedIds([]);
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
          <CardTitle>Bulk-Export</CardTitle>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.length === submissions.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm">Alle auswählen</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {submissions.map(sub => (
            <div key={sub.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
              <Checkbox
                checked={selectedIds.includes(sub.id)}
                onCheckedChange={() => handleToggle(sub.id)}
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{sub.tax_form_type}</div>
                <div className="text-xs text-slate-600">Jahr: {sub.tax_year}</div>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={handleBulkExport}
          disabled={isExporting || selectedIds.length === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileArchive className="w-4 h-4 mr-2" />
          )}
          {selectedIds.length} Formulare exportieren
        </Button>
      </CardContent>
    </Card>
  );
}