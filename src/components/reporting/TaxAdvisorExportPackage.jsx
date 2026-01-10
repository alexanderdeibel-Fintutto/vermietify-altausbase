import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Package, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxAdvisorExportPackage() {
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateTaxAdvisorPackage', {});
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Export-Paket erstellt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Steuerberater-Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Erstellt ein vollständiges Paket mit allen relevanten Dokumenten, Belegen und Auswertungen für Ihren Steuerberater.
        </p>
        <Button onClick={() => exportMutation.mutate()} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Export-Paket erstellen
        </Button>
      </CardContent>
    </Card>
  );
}