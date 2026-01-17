import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';

export default function BuildingEditDialog({ open, onClose, building }) {
  const [formData, setFormData] = useState({
    name: building?.name || '',
    address: building?.address || '',
    building_type: building?.building_type || 'wohnung',
    year_built: building?.year_built || ''
  });
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Building.update(building.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['buildings']);
      onClose();
    }
  });

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Objekt bearbeiten"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button 
            variant="gradient"
            onClick={() => updateMutation.mutate(formData)}
            disabled={updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <VfInput
          label="Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <VfInput
          label="Adresse"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
        <VfSelect
          label="Typ"
          value={formData.building_type}
          onChange={(v) => setFormData({ ...formData, building_type: v })}
          options={[
            { value: 'wohnung', label: 'Wohnung' },
            { value: 'haus', label: 'Haus' },
            { value: 'gewerbe', label: 'Gewerbe' }
          ]}
        />
        <VfInput
          label="Baujahr"
          type="number"
          value={formData.year_built}
          onChange={(e) => setFormData({ ...formData, year_built: e.target.value })}
        />
      </div>
    </VfModal>
  );
}