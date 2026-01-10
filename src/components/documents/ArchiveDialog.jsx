import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle } from 'lucide-react';

const reasons = [
  { value: 'manual', label: 'Manuell archiviert' },
  { value: 'expired', label: 'Abgelaufen' },
  { value: 'replaced', label: 'Durch neuere Version ersetzt' },
  { value: 'completed', label: 'Prozess abgeschlossen' },
  { value: 'other', label: 'Sonstige' }
];

export default function ArchiveDialog({ isOpen, onClose, document }) {
  const [reason, setReason] = useState('manual');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: async () => {
      if (!reason) throw new Error('Grund erforderlich');

      await base44.functions.invoke('archiveDocument', {
        document_id: document.id,
        company_id: document.company_id,
        document_name: document.name,
        document_url: document.url,
        reason,
        notes,
        tags: tags.split(',').map(t => t.trim()).filter(t => t)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['archived-documents'] });
      onClose();
      setReason('manual');
      setNotes('');
      setTags('');
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dokument archivieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-sm text-slate-600">Dokument</p>
            <p className="text-sm font-medium text-slate-900">{document?.name}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Archivierungsgrund</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reasons.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Notizen</label>
            <Textarea
              placeholder="Optionale Notizen zur Archivierung..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Such-Tags</label>
            <Input
              placeholder="Komma-getrennt (z.B. legal, abgelaufen, 2025)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900">
              Das Dokument wird archiviert, aber nicht gelöscht. Sie können es später wiederherstellen.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button
              onClick={() => archiveMutation.mutate()}
              disabled={archiveMutation.isPending}
              className="gap-2"
            >
              Archivieren
            </Button>
          </div>

          {archiveMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-900">{archiveMutation.error.message}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}