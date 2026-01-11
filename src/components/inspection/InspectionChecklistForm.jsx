import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Plus, Trash2, AlertTriangle } from 'lucide-react';

export default function InspectionChecklistForm({ inspectionId, buildingId, companyId, onComplete }) {
  const [currentFinding, setCurrentFinding] = useState({
    category: '',
    severity: 'moderate',
    location: '',
    description: '',
    photos: []
  });
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const queryClient = useQueryClient();

  const { data: findings = [] } = useQuery({
    queryKey: ['inspection-findings', inspectionId],
    queryFn: () => base44.entities.InspectionFinding.filter({ inspection_id: inspectionId })
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result.file_url;
    },
    onSuccess: (url) => setUploadedPhotos([...uploadedPhotos, url])
  });

  const createFindingMutation = useMutation({
    mutationFn: () =>
      base44.entities.InspectionFinding.create({
        inspection_id: inspectionId,
        building_id: buildingId,
        company_id: companyId,
        category: currentFinding.category,
        severity: currentFinding.severity,
        location: currentFinding.location,
        description: currentFinding.description,
        photos: uploadedPhotos,
        requires_immediate_action: currentFinding.severity === 'critical'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-findings'] });
      setCurrentFinding({ category: '', severity: 'moderate', location: '', description: '', photos: [] });
      setUploadedPhotos([]);
    }
  });

  const deleteFindingMutation = useMutation({
    mutationFn: (findingId) => base44.entities.InspectionFinding.delete(findingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inspection-findings'] })
  });

  const severityColors = {
    minor: 'bg-blue-100 text-blue-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    major: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Befund hinzufügen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Kategorie (z.B. Feuerlöscher, Heizung)"
            value={currentFinding.category}
            onChange={(e) => setCurrentFinding({ ...currentFinding, category: e.target.value })}
          />
          
          <Input
            placeholder="Ort (z.B. Keller, Einheit 2A)"
            value={currentFinding.location}
            onChange={(e) => setCurrentFinding({ ...currentFinding, location: e.target.value })}
          />

          <Select
            value={currentFinding.severity}
            onValueChange={(val) => setCurrentFinding({ ...currentFinding, severity: val })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minor">Geringfügig</SelectItem>
              <SelectItem value="moderate">Moderat</SelectItem>
              <SelectItem value="major">Erheblich</SelectItem>
              <SelectItem value="critical">Kritisch</SelectItem>
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Beschreibung des Befunds..."
            value={currentFinding.description}
            onChange={(e) => setCurrentFinding({ ...currentFinding, description: e.target.value })}
            rows={3}
          />

          <div>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('finding-photo').click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Foto aufnehmen
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('finding-upload').click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Hochladen
              </Button>
            </div>
            <input
              id="finding-photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
              className="hidden"
            />
            <input
              id="finding-upload"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
              className="hidden"
            />
            {uploadedPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {uploadedPhotos.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-full h-24 object-cover rounded" />
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={() => createFindingMutation.mutate()}
            disabled={!currentFinding.category || !currentFinding.description}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Befund speichern
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Befunde ({findings.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {findings.map(finding => (
            <div key={finding.id} className="p-3 border rounded">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-sm">{finding.category}</h4>
                  <p className="text-xs text-slate-600">{finding.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={severityColors[finding.severity]}>
                    {finding.severity}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteFindingMutation.mutate(finding.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-700 mb-2">{finding.description}</p>
              {finding.photos?.length > 0 && (
                <div className="grid grid-cols-4 gap-1">
                  {finding.photos.map((photo, i) => (
                    <img key={i} src={photo} alt="" className="w-full h-16 object-cover rounded" />
                  ))}
                </div>
              )}
              {finding.requires_immediate_action && (
                <div className="mt-2 flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-xs font-medium">Sofortmaßnahme erforderlich</span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}