import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Workflow, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkflowBuilder() {
  const [trigger, setTrigger] = useState('transaction.created');
  const [action, setAction] = useState('categorize');

  const createMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('createWorkflow', { trigger, action });
    },
    onSuccess: () => {
      toast.success('Workflow erstellt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="w-5 h-5" />
          Workflow-Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-semibold">Wenn...</label>
          <Select value={trigger} onValueChange={setTrigger}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transaction.created">Neue Transaktion</SelectItem>
              <SelectItem value="document.uploaded">Dokument hochgeladen</SelectItem>
              <SelectItem value="contract.expires">Vertrag läuft ab</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-semibold">Dann...</label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="categorize">Kategorisieren</SelectItem>
              <SelectItem value="notify">Benachrichtigen</SelectItem>
              <SelectItem value="archive">Archivieren</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => createMutation.mutate()} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Workflow erstellen
        </Button>
      </CardContent>
    </Card>
  );
}