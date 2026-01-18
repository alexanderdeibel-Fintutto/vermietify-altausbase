import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function SaveCalculationButton({ calculation, calculatorType }) {
  const saveMutation = useMutation({
    mutationFn: () => base44.entities.Report.create({
      report_type: calculatorType,
      title: `${calculatorType} Berechnung`,
      data: JSON.stringify(calculation),
      generated_date: new Date().toISOString()
    }),
    onSuccess: () => showSuccess('Berechnung gespeichert')
  });

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => saveMutation.mutate()}
      disabled={saveMutation.isPending}
    >
      <Save className="h-4 w-4 mr-2" />
      Speichern
    </Button>
  );
}