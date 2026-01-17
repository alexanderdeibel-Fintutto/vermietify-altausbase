import React, { useState } from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Mail, Download, Share2, CheckCircle } from 'lucide-react';

export default function CalculatorShareDialog({ 
  open, 
  onClose,
  calculatorType,
  result,
  inputData 
}) {
  const [email, setEmail] = useState('');

  const emailMutation = useMutation({
    mutationFn: (email) => base44.functions.invoke('sendCalculationEmail', {
      email,
      calculator_type: calculatorType,
      result
    }),
    onSuccess: () => {
      setEmail('');
      setTimeout(onClose, 1500);
    }
  });

  const pdfMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateCalculatorPDF', {
        calculator_type: calculatorType,
        input_data: inputData,
        result_data: result
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${calculatorType}_berechnung.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    }
  });

  if (emailMutation.isSuccess) {
    return (
      <VfModal open={open} onOpenChange={onClose} title="Erfolgreich!">
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-[var(--vf-success-500)]" />
          <p className="text-lg font-semibold">E-Mail versendet!</p>
        </div>
      </VfModal>
    );
  }

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title="Berechnung teilen"
      size="md"
    >
      <div className="space-y-6">
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Per E-Mail senden
          </h4>
          <div className="flex gap-2">
            <VfInput
              type="email"
              placeholder="empfaenger@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button 
              variant="gradient"
              onClick={() => emailMutation.mutate(email)}
              disabled={!email || emailMutation.isPending}
            >
              {emailMutation.isPending ? '...' : 'Senden'}
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Als PDF herunterladen
          </h4>
          <Button 
            variant="outline"
            className="w-full"
            onClick={() => pdfMutation.mutate()}
            disabled={pdfMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {pdfMutation.isPending ? 'Wird erstellt...' : 'PDF herunterladen'}
          </Button>
        </div>
      </div>
    </VfModal>
  );
}