import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const EXPORT_TYPES = [
  { id: 'buildings', label: 'Gebäude & Einheiten' },
  { id: 'contracts', label: 'Mietverträge' },
  { id: 'invoices', label: 'Rechnungen' },
  { id: 'payments', label: 'Zahlungen' },
  { id: 'tenants', label: 'Mieter' },
  { id: 'documents', label: 'Dokumente (nur Metadaten)' }
];

export default function DataExportDialog({ open, onOpenChange }) {
  const [selectedTypes, setSelectedTypes] = useState(['buildings', 'contracts']);
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  const handleToggleType = (id) => {
    setSelectedTypes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    if (selectedTypes.length === 0) {
      toast.error('Bitte mindestens 1 Datentyp auswählen');
      return;
    }

    setExporting(true);
    try {
      // Mock: Generate export
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `FinX-Export_${timestamp}.${format === 'csv' ? 'zip' : 'json'}`;

      console.log(`Exporting: ${selectedTypes.join(', ')} as ${format}`);

      // In real app: call backend export function
      toast.success(`✅ Export erstellt: ${filename}`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Fehler beim Exportieren');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Daten exportieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-800 text-sm">
              Der Export kann mehrere Minuten dauern. Sie erhalten eine E-Mail mit dem Download-Link.
            </AlertDescription>
          </Alert>

          {/* Format Selection */}
          <div>
            <p className="text-sm font-medium mb-2">Format</p>
            <div className="flex gap-2">
              {['csv', 'json'].map(fmt => (
                <Button
                  key={fmt}
                  variant={format === fmt ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormat(fmt)}
                  className="flex-1"
                >
                  {fmt.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Data Types */}
          <div>
            <p className="text-sm font-medium mb-2">Datentypen</p>
            <div className="space-y-2">
              {EXPORT_TYPES.map(type => (
                <label
                  key={type.id}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                >
                  <Checkbox
                    checked={selectedTypes.includes(type.id)}
                    onCheckedChange={() => handleToggleType(type.id)}
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedTypes.length === 0 || exporting}
              className="gap-2"
            >
              {exporting && <Loader2 className="w-4 h-4 animate-spin" />}
              {exporting ? 'Exportiere...' : 'Exportieren'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}