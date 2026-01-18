import React from 'react';
import { VfModal } from '@/components/shared/VfModal';
import BuildingForm from './BuildingForm';

export default function BuildingEditDialog({ open, onClose, building }) {
  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title={building?.id ? 'Objekt bearbeiten' : 'Neues Objekt'}
      size="lg"
    >
      <BuildingForm building={building} onSubmit={onClose} />
    </VfModal>
  );
}