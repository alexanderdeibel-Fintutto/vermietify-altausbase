import React from 'react';
import { VfModal } from './VfModal';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Bestätigung erforderlich',
  description,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  variant = 'default',
  loading = false
}) {
  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Wird ausgeführt...' : confirmText}
          </Button>
        </>
      }
    >
      {variant === 'destructive' && (
        <div className="flex items-center gap-3 p-4 bg-[var(--vf-error-50)] rounded-lg">
          <AlertTriangle className="h-5 w-5 text-[var(--vf-error-600)]" />
          <p className="text-sm text-[var(--vf-error-700)]">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
        </div>
      )}
    </VfModal>
  );
}