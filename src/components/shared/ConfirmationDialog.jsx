import React from 'react';
import { VfModal } from './VfModal';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmationDialog({ 
  open, 
  onClose, 
  onConfirm, 
  title = 'Bestätigung erforderlich',
  message,
  confirmLabel = 'Bestätigen',
  variant = 'default'
}) {
  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button 
            variant={variant === 'destructive' ? 'destructive' : 'gradient'}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {variant === 'destructive' && (
        <div className="flex items-center gap-3 p-3 bg-[var(--vf-error-50)] rounded-lg mb-4">
          <AlertTriangle className="h-5 w-5 text-[var(--vf-error-600)]" />
          <span className="text-sm font-medium text-[var(--vf-error-700)]">Diese Aktion kann nicht rückgängig gemacht werden</span>
        </div>
      )}
      <p>{message}</p>
    </VfModal>
  );
}