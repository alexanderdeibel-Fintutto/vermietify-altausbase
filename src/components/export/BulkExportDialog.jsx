import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Download, CheckCircle2 } from 'lucide-react';

const EXPORT_OPTIONS = [
  { id: 'buildings', label: 'Gebäude', icon: '🏢' },
  { id: 'tenants', label: 'Mieter', icon: '👥' },
  { id: 'contracts', label: 'Verträge', icon: '📄' },
  { id: 'statements', label: 'Abrechnungen', icon: '📊' },
  { id: 'documents', label: 'Dokumente', icon: '📁' },
  { id: 'financials', label: 'Finanzen', icon: '💰' },
];

const FORMATS = [
  { id: 'csv', label: 'CSV', description: 'Für Excel/Sheets' },
  { id: 'json', label: 'JSON', description: 'Strukturierte Daten' },
  { id: 'pdf', label: 'PDF', description: 'Für Druck/Sharing' },
];

export default function BulkExportDialog({ open, onOpenChange, onExport }) {
  const [selectedItems, setSelectedItems] = useState(EXPORT_OPTIONS.map(o => o.id));
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport({
        items: selectedItems,
        format: selectedFormat
      });
    } finally {
      setIsExporting(false);
      onOpenChange(false);
    }
  };

  const toggleItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Daten exportieren
          </DialogTitle>
          <DialogDescription>
            Wählen Sie, welche Daten Sie exportieren möchten
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Items */}
          <div>
            <h3 className="font-semibold mb-3">Zu exportierende Daten</h3>
            <div className="space-y-2">
              {EXPORT_OPTIONS.map(option => (
                <div key={option.id} className="flex items-center gap-3">
                  <Checkbox
                    id={option.id}
                    checked={selectedItems.includes(option.id)}
                    onCheckedChange={() => toggleItem(option.id)}
                  />
                  <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer flex-1">
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <h3 className="font-semibold mb-3">Dateiformat</h3>
            <div className="space-y-2">
              {FORMATS.map(format => (
                <label
                  key={format.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedFormat === format.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.id}
                    checked={selectedFormat === format.id}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-sm">{format.label}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{format.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedItems.length === 0 || isExporting}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            {isExporting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Download className="w-4 h-4" />
                </motion.div>
                Exportiert...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exportieren
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}