import React, { useState } from 'react';
import { VfBKWizard } from '@/components/workflows/VfBKWizard';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BKAbrechnungWizard() {
  const navigate = useNavigate();
  
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OperatingCostStatement.create(data),
    onSuccess: () => {
      navigate(createPageUrl('OperatingCosts'));
    }
  });

  const handleComplete = (data) => {
    createMutation.mutate(data);
  };

  return (
    <VfBKWizard onComplete={handleComplete} />
  );
}