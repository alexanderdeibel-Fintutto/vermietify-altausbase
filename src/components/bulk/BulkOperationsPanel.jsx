import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkOperationsPanel({ selectedIds = [] }) {
  const [operation, setOperation] = useState('categorize');

  const bulkMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('bulkOperation', { operation, ids: selectedIds });
    },
    onSuccess: () => {
      toast.success(`${selectedIds.length} Einträge verarbeitet`);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Massenbearbeitung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 bg-blue-50 rounded">
          <p className="text-sm"><CheckSquare className="w-4 h-4 inline mr-2" />{selectedIds.length} Einträge ausgewählt</p>
        </div>
        <Select value={operation} onValueChange={setOperation}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="categorize">Kategorisieren</SelectItem>
            <SelectItem value="delete">Löschen</SelectItem>
            <SelectItem value="export">Exportieren</SelectItem>
            <SelectItem value="archive">Archivieren</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => bulkMutation.mutate()} disabled={selectedIds.length === 0} className="w-full">
          Ausführen
        </Button>
      </CardContent>
    </Card>
  );
}