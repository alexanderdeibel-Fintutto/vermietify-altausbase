import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Camera, AlertTriangle, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import MobilePhotoUpload from '@/components/mobile/MobilePhotoUpload';

export default function DamageReport({ buildingId }) {
  const [formData, setFormData] = useState({
    location: '',
    description: '',
    severity: 'medium',
    photos: []
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.BuildingTask.create({
        building_id: buildingId,
        task_title: `Schaden: ${data.location}`,
        description: data.description,
        task_type: 'repair',
        priority: data.severity === 'critical' ? 'urgent' : data.severity,
        attachments: data.photos,
        status: 'open'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentTasks'] });
      toast.success('Schadensmeldung erstellt');
      setFormData({ location: '', description: '', severity: 'medium', photos: [] });
    }
  });

  return (
    <Card className="border-2 border-orange-300">
      <CardHeader className="bg-orange-50">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          Schadensmeldung
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div>
          <label className="text-sm font-semibold mb-2 block">Standort</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="z.B. Keller, Treppenhaus..."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Schwere</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'low', label: 'Gering', color: 'border-blue-600' },
              { value: 'medium', label: 'Mittel', color: 'border-orange-600' },
              { value: 'critical', label: 'Kritisch', color: 'border-red-600' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFormData({ ...formData, severity: opt.value })}
                className={`p-2 rounded-lg border-2 text-sm font-semibold ${
                  formData.severity === opt.value ? opt.color + ' bg-slate-50' : 'border-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Beschreibung</label>
          <Textarea
            placeholder="Was ist beschädigt?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Fotos
          </label>
          <MobilePhotoUpload
            onUploadComplete={(urls) => setFormData({ ...formData, photos: urls })}
            maxFiles={5}
          />
        </div>

        <Button
          onClick={() => createMutation.mutate(formData)}
          disabled={createMutation.isPending || !formData.location}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          Schaden melden
        </Button>
      </CardContent>
    </Card>
  );
}