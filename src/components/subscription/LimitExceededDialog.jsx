import React from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LimitExceededDialog({ 
  open, 
  onClose, 
  limitType,
  current,
  max 
}) {
  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Limit erreicht"
    >
      <div className="text-center py-4">
        <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-[var(--vf-warning-500)]" />
        
        <h3 className="text-xl font-semibold mb-2">
          {limitType}-Limit erreicht
        </h3>
        
        <p className="text-[var(--theme-text-secondary)] mb-6">
          Sie haben {current} von {max} {limitType} genutzt. 
          Upgraden Sie Ihren Plan für mehr Kapazität.
        </p>

        <div className="space-y-3">
          <Link to={createPageUrl('Pricing')}>
            <Button variant="gradient" size="lg" className="w-full">
              <Zap className="h-5 w-5 mr-2" />
              Jetzt upgraden
            </Button>
          </Link>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Abbrechen
          </Button>
        </div>
      </div>
    </VfModal>
  );
}