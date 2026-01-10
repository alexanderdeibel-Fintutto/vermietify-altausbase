import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UserCheck, Share2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxAdvisorInterface() {
  const shareMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('shareWithTaxAdvisor', {
        year: new Date().getFullYear(),
        include_documents: true
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Daten mit Steuerberater geteilt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Steuerberater-Schnittstelle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 mb-1">Status</p>
          <Badge className="bg-green-600">Verbunden</Badge>
        </div>

        <Button
          onClick={() => shareMutation.mutate()}
          disabled={shareMutation.isPending}
          className="w-full"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Alle Daten teilen
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-3 h-3 mr-1" />
            Export DATEV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-3 h-3 mr-1" />
            Export CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}