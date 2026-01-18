import React from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Copy, Mail } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function CalculatorShareDialog({ open, onClose, shareUrl }) {
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    showSuccess('Link kopiert');
  };

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Berechnung teilen"
      footer={
        <Button variant="gradient" onClick={onClose}>Schließen</Button>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <VfInput value={shareUrl} readOnly className="flex-1" />
          <Button variant="outline" onClick={copyLink}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" className="w-full">
          <Mail className="h-4 w-4 mr-2" />
          Per E-Mail teilen
        </Button>
      </div>
    </VfModal>
  );
}