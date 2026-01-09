import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const REPORT_TYPES = [
  { value: 'financial_trends', label: 'Finanztrends' },
  { value: 'cost_optimization', label: 'Kostenoptimierung' },
  { value: 'forecast', label: 'Prognose' }
];

const CATEGORIES = [
  'Marketing', 'IT', 'HR', 'Betrieb', 'Vertrieb', 'Verwaltung', 'Sonstiges'
];

export default function ExportButton({ reportType, onExportStart, onExportComplete }) {
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedReportType, setSelectedReportType] = useState(reportType || 'financial_trends');
  const [periodStart, setPeriodStart] = useState(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [periodEnd, setPeriodEnd] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    if (onExportStart) onExportStart();

    try {
      const payload = {
        report_type: selectedReportType,
        period_start: periodStart,
        period_end: periodEnd,
        categories: selectedCategories
      };

      let response;
      if (selectedFormat === 'csv') {
        response = await base44.functions.invoke('exportReportToCSV', payload);
        
        // Handle CSV download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report_${selectedReportType}_${periodStart}_${periodEnd}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        response = await base44.functions.invoke('exportReportToPDF', payload);
        
        // Handle PDF - would integrate with PDF library
        const filename = response.data?.filename || 'Report.pdf';
        toast.success(`PDF prepared: ${filename}`);
      }

      toast.success('Export erfolgreich erstellt');
      setOpen(false);
      if (onExportComplete) onExportComplete();
    } catch (error) {
      toast.error(`Export-Fehler: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Exportieren
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bericht exportieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report Type */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Berichttyp</Label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
            >
              {REPORT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Format Selection */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Format</Label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="pdf"
                  checked={selectedFormat === 'pdf'}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="cursor-pointer"
                />
                <span className="text-sm">PDF</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="csv"
                  checked={selectedFormat === 'csv'}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="cursor-pointer"
                />
                <span className="text-sm">CSV</span>
              </label>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">
                Von
              </Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">
                Bis
              </Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Categories */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Kategorien (optional)</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {CATEGORIES.map(category => (
                <label key={category} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {selectedCategories.length === 0 ? 'Alle Kategorien' : `${selectedCategories.length} ausgewählt`}
            </p>
          </div>

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird exportiert...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {selectedFormat.toUpperCase()} exportieren
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}