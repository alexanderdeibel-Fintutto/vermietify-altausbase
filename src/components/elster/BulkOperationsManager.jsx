import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BulkOperationsManager({ selectedSubmissions = [], onComplete }) {
  const [action, setAction] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleBulkAction = async () => {
    if (!action || selectedSubmissions.length === 0) {
      toast.error('Bitte Aktion und Submissions auswählen');
      return;
    }

    setProcessing(true);
    try {
      const response = await base44.functions.invoke('bulkStatusUpdate', {
        submission_ids: selectedSubmissions,
        action,
        data: action === 'update_status' ? { status: 'VALIDATED' } : {}
      });

      if (response.data.success) {
        toast.success(`${response.data.results.success} Submissions erfolgreich verarbeitet`);
        onComplete?.();
      }
    } catch (error) {
      toast.error('Bulk-Operation fehlgeschlagen');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Bulk-Operationen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger>
              <SelectValue placeholder="Aktion wählen..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="update_status">Status aktualisieren</SelectItem>
              <SelectItem value="archive">Archivieren</SelectItem>
              <SelectItem value="validate">Validieren</SelectItem>
              <SelectItem value="generate_pdf">PDF generieren</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-slate-600">
          {selectedSubmissions.length} Submissions ausgewählt
        </div>

        <Button
          onClick={handleBulkAction}
          disabled={processing || !action || selectedSubmissions.length === 0}
          className="w-full"
        >
          {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {processing ? 'Verarbeite...' : 'Ausführen'}
        </Button>
      </CardContent>
    </Card>
  );
}