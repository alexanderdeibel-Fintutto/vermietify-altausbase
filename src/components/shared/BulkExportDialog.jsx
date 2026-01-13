import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileDown, Loader2 } from 'lucide-react';

export default function BulkExportDialog({
  open = false,
  onOpenChange,
  formats = ['CSV', 'Excel', 'PDF'],
  onExport,
  loading = false,
}) {
  const [selectedFormats, setSelectedFormats] = useState(['CSV']);

  const handleExport = async () => {
    await onExport?.(selectedFormats);
    onOpenChange?.(false);
  };

  const toggleFormat = (format) => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            Daten exportieren
          </DialogTitle>
          <DialogDescription>
            Wählen Sie die gewünschten Exportformate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {formats.map((format) => (
            <div key={format} className="flex items-center gap-2">
              <Checkbox
                id={format}
                checked={selectedFormats.includes(format)}
                onCheckedChange={() => toggleFormat(format)}
              />
              <label
                htmlFor={format}
                className="text-sm font-medium cursor-pointer"
              >
                {format}
              </label>
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => onOpenChange?.(false)}
            variant="outline"
            disabled={loading}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedFormats.length === 0 || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird exportiert...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Exportieren
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}