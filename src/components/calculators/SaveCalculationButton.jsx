import React from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from 'sonner';

export default function SaveCalculationButton({ 
  calculatorType,
  inputData,
  resultData,
  primaryResult,
  primaryResultLabel
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      
      const response = await base44.functions.invoke('trackCalculation', {
        calculator_type: calculatorType,
        input_data: inputData,
        result_data: resultData,
        primary_result: primaryResult,
        primary_result_label: primaryResultLabel,
        user_id: user?.id || null
      });

      const calcId = response.data.calculation_id;
      
      await base44.entities.CalculationHistory.update(calcId, {
        saved: true
      });

      return calcId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calculations']);
      toast.success('Berechnung gespeichert');
    }
  });

  return (
    <Button 
      variant="outline"
      onClick={() => saveMutation.mutate()}
      disabled={saveMutation.isPending}
    >
      <Bookmark className="h-4 w-4 mr-2" />
      {saveMutation.isPending ? 'Wird gespeichert...' : 'Speichern'}
    </Button>
  );
}