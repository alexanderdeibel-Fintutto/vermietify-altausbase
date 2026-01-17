import React from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LimitExceededDialog({ open, onClose, limitType }) {
  const navigate = useNavigate();

  const messages = {
    buildings: 'Sie haben das Limit für Objekte erreicht.',
    units: 'Sie haben das Limit für Einheiten erreicht.',
    tenants: 'Sie haben das Limit für Mieter erreicht.'
  };

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Limit erreicht"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button 
            variant="gradient"
            onClick={() => {
              navigate(createPageUrl('Pricing'));
              onClose();
            }}
          >
            <Zap className="h-4 w-4 mr-2" />
            Jetzt upgraden
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-[var(--vf-warning-50)] rounded-lg">
          <AlertTriangle className="h-6 w-6 text-[var(--vf-warning-600)]" />
          <p className="font-medium text-[var(--vf-warning-700)]">
            {messages[limitType] || 'Limit erreicht'}
          </p>
        </div>
        <p className="text-sm text-[var(--theme-text-secondary)]">
          Upgraden Sie Ihren Plan, um mehr {limitType === 'buildings' ? 'Objekte' : limitType === 'units' ? 'Einheiten' : 'Mieter'} hinzuzufügen.
        </p>
      </div>
    </VfModal>
  );
}