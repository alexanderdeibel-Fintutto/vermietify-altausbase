import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Upload, Activity, Camera } from 'lucide-react';
import { toast } from 'sonner';

const issueTypes = [
  { value: 'heating', label: 'Heizung' },
  { value: 'plumbing', label: 'Sanitär' },
  { value: 'electrical', label: 'Elektrik' },
  { value: 'appliance', label: 'Geräte/Ausstattung' },
  { value: 'temperature', label: 'Temperatur' },
  { value: 'humidity', label: 'Luftfeuchtigkeit' },
  { value: 'noise', label: 'Lärm' },
  { value: 'other', label: 'Sonstiges' }
];

export default function TenantIssueReporter({ tenantId, unitId, buildingId }) {
  const [formData, setFormData] = useState({
    issue_type: 'other',
    title: '',
    description: '',
    severity: 'medium',
    photos: []
  });

  const queryClient = useQueryClient();

  const { data: sensors = [] } = useQuery({
    queryKey: ['unit-sensors', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      return await base44.entities.IoTSensor.filter({ unit_id: unitId });
    },
    enabled: !!unitId
  });

  const { data: myIssues = [] } = useQuery({
    queryKey: ['tenant-issues', tenantId],
    queryFn: async () => {
      const issues = await base44.entities.TenantIssueReport.filter({ tenant_id: tenantId });
      return issues.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!tenantId
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Check if there's a related sensor
      let relatedSensor = null;
      let sensorValue = null;

      if (['temperature', 'humidity'].includes(formData.issue_type)) {
        relatedSensor = sensors.find(s => 
          s.sensor_type === formData.issue_type && s.is_online
        );
        if (relatedSensor) {
          sensorValue = relatedSensor.current_value;
        }
      }

      const issue = await base44.entities.TenantIssueReport.create({
        tenant_id: tenantId,
        unit_id: unitId,
        building_id: buildingId,
        issue_type: formData.issue_type,
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        photos: formData.photos,
        related_sensor_id: relatedSensor?.id,
        sensor_reading_value: sensorValue,
        status: 'open'
      });

      // Trigger workflow to create maintenance task
      await base44.functions.invoke('createMaintenanceFromIssue', {
        issue_id: issue.id
      });

      return issue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tenant-issues']);
      setFormData({
        issue_type: 'other',
        title: '',
        description: '',
        severity: 'medium',
        photos: []
      });
      toast.success('Störungsmeldung gesendet');
    }
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploadPromises = files.map(async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    });
    const uploaded = await Promise.all(uploadPromises);
    setFormData({ ...formData, photos: [...formData.photos, ...uploaded] });
  };

  const relatedSensor = sensors.find(s => 
    s.sensor_type === formData.issue_type && s.is_online
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Störung oder Problem melden
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Art der Störung</label>
            <Select
              value={formData.issue_type}
              onValueChange={(value) => setFormData({ ...formData, issue_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {relatedSensor && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">
                  Sensor erkannt: {relatedSensor.sensor_name}
                </span>
              </div>
              <div className="text-sm text-slate-700">
                Aktueller Messwert: <strong>{relatedSensor.current_value?.toFixed(1)} {relatedSensor.unit}</strong>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Diese Sensordaten werden automatisch mit Ihrer Meldung verknüpft
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold mb-2 block">Titel</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Kurze Beschreibung des Problems"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Beschreibung</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detaillierte Beschreibung..."
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Dringlichkeit</label>
            <Select
              value={formData.severity}
              onValueChange={(value) => setFormData({ ...formData, severity: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Niedrig</SelectItem>
                <SelectItem value="medium">Mittel</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
                <SelectItem value="critical">Kritisch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {formData.photos.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!formData.title || !formData.description || submitMutation.isPending}
              className="flex-1"
            >
              Meldung absenden
            </Button>
            <label>
              <Button variant="outline" asChild>
                <div>
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meine Meldungen</CardTitle>
        </CardHeader>
        <CardContent>
          {myIssues.length === 0 ? (
            <p className="text-slate-600 text-center py-4">Keine Meldungen</p>
          ) : (
            <div className="space-y-2">
              {myIssues.map(issue => (
                <div key={issue.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{issue.title}</p>
                      <p className="text-xs text-slate-600">
                        {new Date(issue.created_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <Badge className={
                      issue.status === 'resolved' ? 'bg-green-500' :
                      issue.status === 'in_progress' ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }>
                      {issue.status}
                    </Badge>
                  </div>
                  {issue.related_sensor_id && (
                    <div className="text-xs text-blue-600 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Sensor-Daten verknüpft
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}