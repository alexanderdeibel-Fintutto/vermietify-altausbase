import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Layers } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkOperationsPanel() {
  const [operation, setOperation] = useState('update');
  const [entityType, setEntityType] = useState('Building');
  const queryClient = useQueryClient();

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('bulkOperation', { 
        operation,
        entity_type: entityType,
        data: {}
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      toast.success(`${data.affected} Einträge bearbeitet`);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Bulk-Operationen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Building">Gebäude</SelectItem>
            <SelectItem value="Tenant">Mieter</SelectItem>
            <SelectItem value="Document">Dokumente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={operation} onValueChange={setOperation}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="update">Aktualisieren</SelectItem>
            <SelectItem value="delete">Löschen</SelectItem>
            <SelectItem value="export">Exportieren</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => bulkMutation.mutate()} className="w-full">
          Operation ausführen
        </Button>
      </CardContent>
    </Card>
  );
}