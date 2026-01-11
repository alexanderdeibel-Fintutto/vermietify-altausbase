import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Wrench, Camera, Upload, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import ServiceRatingDialog from './ServiceRatingDialog';

export default function TenantMaintenanceTracker({ tenantId, unitId, companyId }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tenant-maintenance', tenantId],
    queryFn: () => base44.entities.MaintenanceTask.filter({ tenant_id: tenantId }, '-created_date')
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result.file_url;
    },
    onSuccess: (fileUrl) => setUploadedFiles([...uploadedFiles, fileUrl])
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      base44.entities.MaintenanceTask.create({
        tenant_id: tenantId,
        unit_id: unitId,
        company_id: companyId,
        title,
        description,
        priority: 'medium',
        status: 'open',
        attachments: uploadedFiles,
        task_type: 'repair',
        reported_by: 'tenant'
      }),
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setUploadedFiles([]);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['tenant-maintenance'] });
    }
  });

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <AlertCircle className="w-4 h-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Wartungsanfragen
          </span>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            + Neue Anfrage
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 border rounded-lg bg-slate-50 space-y-3">
            <Input
              placeholder="Problem kurz beschreiben (z.B. 'Heizung defekt')"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Detaillierte Beschreibung des Problems..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <div>
              <p className="text-sm mb-2">Fotos/Videos anhängen:</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('maintenance-photo').click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Foto aufnehmen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('maintenance-file').click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Datei hochladen
                </Button>
              </div>
              <input
                id="maintenance-photo"
                type="file"
                accept="image/*,video/*"
                capture="environment"
                onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
                className="hidden"
              />
              <input
                id="maintenance-file"
                type="file"
                onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
                className="hidden"
              />
              {uploadedFiles.length > 0 && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ {uploadedFiles.length} Datei(en) hochgeladen
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={!title || submitMutation.isPending}
                className="flex-1"
              >
                Anfrage absenden
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-center text-slate-600 py-8">Keine Wartungsanfragen vorhanden</p>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <h3 className="font-medium">{task.title}</h3>
                  </div>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status === 'completed' ? 'Erledigt' : task.status === 'in_progress' ? 'In Bearbeitung' : 'Offen'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3">{task.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Gemeldet: {new Date(task.created_date).toLocaleDateString('de-DE')}</span>
                  {task.attachments && task.attachments.length > 0 && (
                    <span>{task.attachments.length} Anhang/Anhänge</span>
                  )}
                </div>
                {task.resolution_notes && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <p className="font-medium text-green-900">Lösung:</p>
                    <p className="text-green-700">{task.resolution_notes}</p>
                  </div>
                )}
                {task.status === 'completed' && (
                  <div className="mt-3">
                    <ServiceRatingDialog
                      maintenanceTask={task}
                      tenantId={tenantId}
                      companyId={companyId}
                      ratingType="vendor"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}