import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Zap, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function BulkOperationsPanel({ items = [], onSelectionChange }) {
  const [selected, setSelected] = useState(new Set());
  const [operation, setOperation] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const selectedItems = items.filter((_, idx) => selected.has(idx));
      
      if (operation === 'delete') {
        await Promise.all(selectedItems.map(item => 
          base44.entities[item.entityType]?.delete?.(item.id)
        ));
      } else if (operation === 'archive') {
        await Promise.all(selectedItems.map(item =>
          base44.entities[item.entityType]?.update?.(item.id, { archived: true })
        ));
      } else if (operation === 'status') {
        await Promise.all(selectedItems.map(item =>
          base44.entities[item.entityType]?.update?.(item.id, { status: 'completed' })
        ));
      }

      return selectedItems.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries();
      toast.success(`✅ ${count} Einträge aktualisiert`);
      setSelected(new Set());
      setOperation('');
      setShowConfirm(false);
    }
  });

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((_, idx) => idx)));
    }
  };

  const toggleItem = (idx) => {
    const newSelected = new Set(selected);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelected(newSelected);
    onSelectionChange?.(newSelected);
  };

  if (items.length === 0) return null;

  return (
    <>
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Bulk-Operationen ({selected.size} ausgewählt)
            </span>
            <Checkbox
              checked={selected.size === items.length && items.length > 0}
              onCheckedChange={toggleAll}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Item List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 hover:bg-blue-100 rounded">
                <Checkbox
                  checked={selected.has(idx)}
                  onCheckedChange={() => toggleItem(idx)}
                />
                <span className="text-sm flex-1">{item.name || item.title || `Item ${idx + 1}`}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Aktion wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">✓ Mark As Completed</SelectItem>
                <SelectItem value="archive">📦 Archivieren</SelectItem>
                <SelectItem value="delete">🗑️ Löschen</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setShowConfirm(true)}
              disabled={selected.size === 0 || !operation || bulkMutation.isPending}
              variant={operation === 'delete' ? 'destructive' : 'default'}
              className="gap-2"
            >
              {bulkMutation.isPending ? 'Verarbeite...' : 'Anwenden'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Bestätigung</AlertDialogTitle>
          <AlertDialogDescription>
            Sie sind dabei, {selected.size} Einträge zu {operation === 'delete' ? 'löschen' : 'archivieren'}. Dieser Vorgang kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkMutation.mutate()}
              className={operation === 'delete' ? 'bg-red-600' : ''}
            >
              Bestätigen
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}