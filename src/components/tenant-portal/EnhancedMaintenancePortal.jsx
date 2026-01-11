import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wrench, Plus, Camera, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function EnhancedMaintenancePortal({ tenantId, buildingId, companyId }) {
  const [showForm, setShowForm] = useState(false);
  const [request, setRequest] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium'
  });
  const [photos, setPhotos] = useState([]);
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['tenant-maintenance', tenantId],
    queryFn: async () => {
      const tasks = await base44.entities.MaintenanceTask.filter({ 
        building_id: buildingId 
      }, '-created_date', 20);
      return tasks;
    },
    enabled: !!buildingId
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result.file_url;
    },
    onSuccess: (url) => setPhotos([...photos, url])
  });

  const createRequestMutation = useMutation({
    mutationFn: () =>
      base44.entities.MaintenanceTask.create({
        building_id: buildingId,
        company_id: companyId,
        title: request.title,
        description: request.description,
        category: request.category,
        priority: request.priority,
        status: 'open',
        photos: photos
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-maintenance'] });
      setShowForm(false);
      setRequest({ title: '', description: '', category: 'other', priority: 'medium' });
      setPhotos([]);
    }
  });

  const statusIcons = {
    open: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Offen' },
    in_progress: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800', label: 'In Bearbeitung' },
    completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Erledigt' }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Meine Wartungsanfragen
              </CardTitle>
              <Button onClick={() => setShowForm(!showForm)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Neue Anfrage
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {requests.map(req => {
              const statusInfo = statusIcons[req.status] || statusIcons.open;
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={req.id} className="p-4 border rounded hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{req.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{req.description}</p>
                    </div>
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                    <span>{new Date(req.created_date).toLocaleDateString('de-DE')}</span>
                    <span className="capitalize">{req.category}</span>
                    <Badge variant="outline" className="text-xs">{req.priority}</Badge>
                  </div>
                  {req.photos?.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-1">
                      {req.photos.map((photo, i) => (
                        <img key={i} src={photo} alt="" className="w-full h-16 object-cover rounded" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {requests.length === 0 && (
              <p className="text-center text-slate-600 py-8">Keine Wartungsanfragen vorhanden</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Neue Wartungsanfrage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Titel der Anfrage"
                value={request.title}
                onChange={(e) => setRequest({ ...request, title: e.target.value })}
              />

              <Select
                value={request.category}
                onValueChange={(val) => setRequest({ ...request, category: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heating">Heizung</SelectItem>
                  <SelectItem value="plumbing">Sanitär</SelectItem>
                  <SelectItem value="electrical">Elektrik</SelectItem>
                  <SelectItem value="windows">Fenster</SelectItem>
                  <SelectItem value="appliances">Geräte</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={request.priority}
                onValueChange={(val) => setRequest({ ...request, priority: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Normal</SelectItem>
                  <SelectItem value="high">Dringend</SelectItem>
                  <SelectItem value="urgent">Notfall</SelectItem>
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Beschreiben Sie das Problem..."
                value={request.description}
                onChange={(e) => setRequest({ ...request, description: e.target.value })}
                rows={4}
              />

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('photo-input').click()}
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('upload-input').click()}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Hochladen
                  </Button>
                </div>
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
                  className="hidden"
                />
                <input
                  id="upload-input"
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
                  className="hidden"
                />
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((url, i) => (
                      <img key={i} src={url} alt="" className="w-full h-20 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={() => createRequestMutation.mutate()}
                disabled={!request.title || !request.description || createRequestMutation.isPending}
                className="w-full"
              >
                Anfrage einreichen
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}