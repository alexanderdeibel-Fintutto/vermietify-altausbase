import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Zap, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function BulkOperationsPanel({ open, onOpenChange, selectedItems = [], entityType = 'Building' }) {
  const [operation, setOperation] = useState('edit');
  const [fieldToUpdate, setFieldToUpdate] = useState('');
  const [newValue, setNewValue] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const operations = selectedItems.map(item => {
        if (operation === 'delete') {
          return base44.entities[entityType].delete(item.id);
        } else if (operation === 'edit') {
          return base44.entities[entityType].update(item.id, { [fieldToUpdate]: newValue });
        }
      });
      return Promise.all(operations);
    },
    onSuccess: (results) => {
      toast.success(`✅ ${results.length} Einträge aktualisiert`);
      handleReset();
      onOpenChange(false);
    },
    onError: () => toast.error('Fehler bei Bulk-Operation')
  });

  const handleReset = () => {
    setOperation('edit');
    setFieldToUpdate('');
    setNewValue('');
    setConfirmed(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk-Operationen</DialogTitle>
        </DialogHeader>

        {selectedItems.length === 0 ? (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>Bitte wählen Sie mindestens 1 Eintrag aus</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Selection Info */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800 text-sm">
                ✓ {selectedItems.length} {selectedItems.length === 1 ? 'Eintrag' : 'Einträge'} ausgewählt
              </AlertDescription>
            </Alert>

            {/* Operation Type */}
            <div>
              <label className="text-sm font-medium">Operation</label>
              <Select value={operation} onValueChange={setOperation}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">✏️ Bearbeiten</SelectItem>
                  <SelectItem value="delete">🗑️ Löschen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Edit Fields */}
            {operation === 'edit' && (
              <>
                <div>
                  <label className="text-sm font-medium">Feld</label>
                  <Input
                    placeholder="z.B. status, category"
                    value={fieldToUpdate}
                    onChange={(e) => setFieldToUpdate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Neuer Wert</label>
                  <Input
                    placeholder="Neuer Wert"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </>
            )}

            {/* Confirmation */}
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-sm">
                Diese Aktion kann nicht rückgängig gemacht werden!
              </AlertDescription>
            </Alert>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={confirmed}
                onCheckedChange={setConfirmed}
              />
              <span className="text-sm">
                Ich bestätige die {operation === 'delete' ? 'Löschung' : 'Änderung'} von {selectedItems.length} Eintrag(en)
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => bulkMutation.mutate()}
                disabled={!confirmed || bulkMutation.isPending || (!fieldToUpdate && operation === 'edit')}
                variant={operation === 'delete' ? 'destructive' : 'default'}
                className="gap-2"
              >
                {bulkMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {bulkMutation.isPending ? 'Führe aus...' : 'Ausführen'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}