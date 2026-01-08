import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Archive, Send, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BulkActionsPanel({ selectedSubmissions, onActionComplete }) {
  const [action, setAction] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleBulkAction = async () => {
    if (!action || selectedSubmissions.length === 0) return;

    setProcessing(true);
    try {
      let response;
      
      switch (action) {
        case 'validate':
          response = await base44.functions.invoke('batchValidateElsterSubmissions', {
            submission_ids: selectedSubmissions
          });
          toast.success(`${response.data.successful} Submissions validiert`);
          break;

        case 'archive':
          for (const id of selectedSubmissions) {
            await base44.functions.invoke('archiveElsterSubmission', { submission_id: id });
          }
          toast.success(`${selectedSubmissions.length} Submissions archiviert`);
          break;

        case 'delete':
          for (const id of selectedSubmissions) {
            await base44.entities.ElsterSubmission.delete(id);
          }
          toast.success(`${selectedSubmissions.length} Submissions gelöscht`);
          break;

        case 'export':
          response = await base44.functions.invoke('exportSubmissionsToExcel', {
            submission_ids: selectedSubmissions
          });
          const blob = new Blob([response.data], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'elster_submissions_export.xlsx';
          a.click();
          toast.success('Excel-Export erfolgreich');
          break;

        default:
          toast.error('Unbekannte Aktion');
      }

      onActionComplete?.();
      setAction('');
    } catch (error) {
      toast.error('Aktion fehlgeschlagen');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          Massenoperationen
          {selectedSubmissions.length > 0 && (
            <Badge>{selectedSubmissions.length} ausgewählt</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger>
            <SelectValue placeholder="Aktion wählen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="validate">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Validieren
              </div>
            </SelectItem>
            <SelectItem value="archive">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Archivieren (GoBD)
              </div>
            </SelectItem>
            <SelectItem value="export">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Excel-Export
              </div>
            </SelectItem>
            <SelectItem value="delete">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Löschen
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handleBulkAction}
          disabled={processing || !action || selectedSubmissions.length === 0}
          className="w-full"
        >
          {processing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          {processing ? 'Wird ausgeführt...' : 'Aktion ausführen'}
        </Button>

        <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
          💡 Wählen Sie Submissions in der Liste aus, um Massenoperationen durchzuführen.
        </div>
      </CardContent>
    </Card>
  );
}