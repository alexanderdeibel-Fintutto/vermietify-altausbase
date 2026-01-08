import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function DeleteConfirmDialog({ building, open, onConfirm, onCancel, loading }) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gebäude löschen?</DialogTitle>
          <DialogDescription>
            {building?.name} wird gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Wird gelöscht...' : 'Löschen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}