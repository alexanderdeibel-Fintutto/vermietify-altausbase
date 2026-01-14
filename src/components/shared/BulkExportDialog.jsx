import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Table as TableIcon } from 'lucide-react';
import { useToast } from '@/components/shared/ToastNotificationCenter';

const exportFormats = [
  { value: 'csv', label: 'CSV', icon: TableIcon },
  { value: 'excel', label: 'Excel', icon: TableIcon },
  { value: 'pdf', label: 'PDF', icon: FileText }
];

export default function BulkExportDialog({ 
  open,
  onClose,
  selectedItems = [],
  allFields = [],
  onExport,
  entityName = 'Einträge'
}) {
  const [format, setFormat] = useState('csv');
  const [selectedFields, setSelectedFields] = useState(allFields.map(f => f.key));
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const toggleField = (fieldKey) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey)
        ? prev.filter(k => k !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const toggleAll = () => {
    setSelectedFields(prev => 
      prev.length === allFields.length ? [] : allFields.map(f => f.key)
    );
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast.error('Bitte wählen Sie mindestens ein Feld aus');
      return;
    }

    setLoading(true);
    try {
      await onExport?.({
        items: selectedItems,
        fields: selectedFields,
        format
      });
      toast.success(`${selectedItems.length} ${entityName} erfolgreich exportiert`);
      onClose?.();
    } catch (error) {
      toast.error('Export fehlgeschlagen', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Daten exportieren
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-slate-600 mb-3">
              {selectedItems.length} {entityName} zum Export ausgewählt
            </p>
          </div>

          <div>
            <Label className="mb-2">Export-Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exportFormats.map((fmt) => {
                  const Icon = fmt.icon;
                  return (
                    <SelectItem key={fmt.value} value={fmt.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {fmt.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Zu exportierende Felder</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAll}
              >
                {selectedFields.length === allFields.length ? 'Keine auswählen' : 'Alle auswählen'}
              </Button>
            </div>
            
            <div className="border border-slate-200 rounded-lg p-3 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {allFields.map((field) => (
                  <div key={field.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.key}
                      checked={selectedFields.includes(field.key)}
                      onCheckedChange={() => toggleField(field.key)}
                    />
                    <Label
                      htmlFor={field.key}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={handleExport} disabled={loading || selectedFields.length === 0}>
            {loading ? 'Exportiere...' : 'Exportieren'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}