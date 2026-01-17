import React from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { Button } from '@/components/ui/button';
import { Lock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UpgradePrompt({ 
  open, 
  onClose, 
  feature,
  requiredPlan = 'Professional' 
}) {
  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Upgrade erforderlich"
    >
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--vf-gradient-primary)] flex items-center justify-center">
          <Lock className="h-8 w-8 text-white" />
        </div>

        <h3 className="text-xl font-semibold mb-2">
          {feature || 'Diese Funktion'} ist im {requiredPlan}-Plan verfügbar
        </h3>

        <p className="text-[var(--theme-text-secondary)] mb-6">
          Upgraden Sie jetzt und nutzen Sie alle Features ohne Einschränkungen
        </p>

        <div className="space-y-3">
          <Link to={createPageUrl('Pricing')}>
            <Button variant="gradient" size="lg" className="w-full">
              <Zap className="h-5 w-5 mr-2" />
              Jetzt upgraden
            </Button>
          </Link>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Später
          </Button>
        </div>
      </div>
    </VfModal>
  );
}