import React from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';

export default function GuidedTourSpotlight({ 
  open, 
  onClose, 
  title,
  description,
  targetElement 
}) {
  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title={title}
    >
      <div className="py-4">
        <p className="text-[var(--theme-text-secondary)] mb-6">{description}</p>
        <Button variant="gradient" onClick={onClose} className="w-full">
          Verstanden
        </Button>
      </div>
    </VfModal>
  );
}