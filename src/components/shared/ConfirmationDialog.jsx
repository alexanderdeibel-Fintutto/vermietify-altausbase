import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function ConfirmationDialog({
  open = false,
  onOpenChange,
  onConfirm,
  title = 'Bestätigung erforderlich',
  description = 'Dieser Vorgang kann nicht rückgängig gemacht werden.',
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  destructive = false,
  loading = false
}) {
  const Icon = destructive ? Trash2 : AlertTriangle;
  const iconColor = destructive ? 'text-red-600' : 'text-amber-600';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="flex items-start gap-4">
          <Icon className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={destructive ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {loading ? 'Wird verarbeitet...' : confirmText}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}