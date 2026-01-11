import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Mic, MapPin, CheckCircle2, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function FieldTaskDetailDialog({ isOpen, onClose, task }) {
  const [notes, setNotes] = useState(task.notes || '');
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: async (updates) => {
      return await base44.entities.FieldTask.update(task.id, updates);
    },
    onSuccess: () => {
      toast.success('Aufgabe aktualisiert');
      queryClient.invalidateQueries(['field-tasks']);
    }
  });

  const completeTaskMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.FieldTask.update(task.id, {
        status: 'erledigt',
        completed_date: new Date().toISOString(),
        notes: notes
      });
    },
    onSuccess: () => {
      toast.success('Aufgabe erledigt!');
      queryClient.invalidateQueries(['field-tasks']);
      onClose();
    }
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const updatedPhotos = [...(task.photos || []), file_url];
      await base44.entities.FieldTask.update(task.id, { photos: updatedPhotos });
      return file_url;
    },
    onSuccess: () => {
      toast.success('Foto hochgeladen');
      queryClient.invalidateQueries(['field-tasks']);
    }
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task.title}
            {task.status === 'erledigt' && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Status & Priority */}
          <div className="flex gap-2">
            <Badge className={
              task.status === 'erledigt' ? 'bg-green-100 text-green-800' :
              task.status === 'in_bearbeitung' ? 'bg-blue-100 text-blue-800' :
              'bg-slate-100 text-slate-800'
            }>
              {task.status}
            </Badge>
            <Badge className={
              task.priority === 'sofort' ? 'bg-red-500 text-white' :
              task.priority === 'hoch' ? 'bg-orange-500 text-white' :
              'bg-slate-200 text-slate-800'
            }>
              {task.priority}
            </Badge>
            <Badge variant="outline">{task.task_category?.replace('objekt_', '')}</Badge>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-sm font-medium mb-1">Beschreibung:</p>
              <p className="text-sm text-slate-600">{task.description}</p>
            </div>
          )}

          {/* Meter Reading Data */}
          {task.meter_reading && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <p className="text-sm font-medium mb-2">Zählerablesung</p>
                <div className="space-y-1 text-sm">
                  <p>Typ: {task.meter_reading.meter_type}</p>
                  <p>Stand: {task.meter_reading.reading_value}</p>
                  {task.meter_reading.meter_number && (
                    <p>Zählernummer: {task.meter_reading.meter_number}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inspection Data */}
          {task.inspection_data && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <p className="text-sm font-medium mb-2">Prüfungsergebnis</p>
                <div className="space-y-1 text-sm">
                  <p>Ergebnis: {
                    task.inspection_data.result === 'passed' ? '✓ In Ordnung' :
                    task.inspection_data.result === 'failed' ? '✗ Nicht bestanden' :
                    '! Mängel festgestellt'
                  }</p>
                  {task.inspection_data.findings && (
                    <p>Befunde: {task.inspection_data.findings}</p>
                  )}
                  {task.inspection_data.next_inspection_date && (
                    <p>Nächste Prüfung: {new Date(task.inspection_data.next_inspection_date).toLocaleDateString('de-DE')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          {task.photos?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Fotos ({task.photos.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {task.photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upload Photo */}
          {task.status !== 'erledigt' && (
            <div>
              <label htmlFor="photo-upload">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Camera className="w-4 h-4 mr-2" />
                    Foto hinzufügen
                  </span>
                </Button>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                capture="environment"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-sm font-medium mb-2">Notizen</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Zusätzliche Notizen..."
              disabled={task.status === 'erledigt'}
            />
          </div>

          {/* GPS Location */}
          {task.gps_location && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4" />
              GPS: {task.gps_location.latitude.toFixed(6)}, {task.gps_location.longitude.toFixed(6)}
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-slate-500 space-y-1 pt-4 border-t">
            <p>Erstellt: {new Date(task.created_date).toLocaleString('de-DE')}</p>
            {task.completed_date && (
              <p>Erledigt: {new Date(task.completed_date).toLocaleString('de-DE')}</p>
            )}
            {task.created_via && (
              <p>Erstellt via: {task.created_via === 'voice' ? 'Spracheingabe' : task.created_via}</p>
            )}
          </div>

          {/* Actions */}
          {task.status !== 'erledigt' && (
            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={() => completeTaskMutation.mutate()}
                disabled={completeTaskMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Als erledigt markieren
              </Button>
              <Button
                variant="outline"
                onClick={() => updateTaskMutation.mutate({ notes })}
                disabled={updateTaskMutation.isPending}
              >
                Notizen speichern
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}