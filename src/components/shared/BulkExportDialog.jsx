import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkExportDialog({ open, onOpenChange, items = [], type = 'contracts' }) {
  const [selectedItems, setSelectedItems] = useState(items.map(i => i.id));
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState('pdf');

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(i => i.id));
    }
  };

  const handleToggleItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    if (selectedItems.length === 0) {
      toast.error('Bitte mindestens 1 Element auswählen');
      return;
    }

    setExporting(true);
    try {
      // Simulate PDF generation
      const selectedData = items.filter(item => selectedItems.includes(item.id));
      
      // Mock: Create ZIP with PDFs
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Export_${type}_${timestamp}.zip`;

      // In real app: generate PDFs and create ZIP
      console.log(`Exporting ${selectedItems.length} ${type} as ${format}...`);
      
      toast.success(`✅ ${selectedItems.length} ${type} als ${format.toUpperCase()} exportiert`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Fehler beim Exportieren');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Massenexport: {type}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format Selection */}
          <div className="border-b pb-3">
            <p className="text-sm font-medium mb-2">Format</p>
            <div className="flex gap-3">
              {['pdf', 'csv', 'zip'].map(fmt => (
                <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={fmt}
                    checked={format === fmt}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm capitalize">{fmt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Items Selection */}
          <div className="border-b pb-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Elemente ({selectedItems.length}/{items.length})</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSelectAll}
              >
                {selectedItems.length === items.length ? 'Alle abwählen' : 'Alle auswählen'}
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.map(item => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                >
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => handleToggleItem(item.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.title || item.name || item.contract_number || 'Unnamed'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {item.created_date && new Date(item.created_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Warning */}
          {selectedItems.length > 50 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-sm">
                Großexport: {selectedItems.length} Elemente können länger dauern
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedItems.length === 0 || exporting}
              className="gap-2"
            >
              {exporting && <Loader2 className="w-4 h-4 animate-spin" />}
              {exporting ? 'Exportiere...' : `Exportiere ${selectedItems.length}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}