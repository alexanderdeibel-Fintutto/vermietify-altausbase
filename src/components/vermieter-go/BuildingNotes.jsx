import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { StickyNote, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BuildingNotes({ buildingId, unitId }) {
  const [newNote, setNewNote] = useState('');
  const queryClient = useQueryClient();

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', buildingId, unitId],
    queryFn: () => base44.entities.Document.filter(
      {
        category: 'Sonstiges',
        name: { $regex: 'Notiz' },
        ...(buildingId && { building_id: buildingId }),
        ...(unitId && { unit_id: unitId })
      },
      '-created_date',
      20
    )
  });

  const createMutation = useMutation({
    mutationFn: async (text) => {
      return await base44.entities.Document.create({
        name: `Notiz ${new Date().toLocaleDateString('de-DE')}`,
        content: text,
        category: 'Sonstiges',
        status: 'erstellt',
        building_id: buildingId,
        unit_id: unitId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Notiz gespeichert');
      setNewNote('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <StickyNote className="w-4 h-4" />
          Notizen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Textarea
            placeholder="Neue Notiz..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={2}
          />
          <Button
            onClick={() => createMutation.mutate(newNote)}
            disabled={!newNote}
            size="sm"
            className="w-full"
          >
            <Plus className="w-3 h-3 mr-1" />
            Notiz hinzufügen
          </Button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {notes.map(note => (
            <div key={note.id} className="p-2 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-sm">{note.content}</p>
              <p className="text-xs text-slate-600 mt-1">
                {new Date(note.created_date).toLocaleDateString('de-DE')}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}