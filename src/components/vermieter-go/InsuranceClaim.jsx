import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import MobilePhotoUpload from '@/components/mobile/MobilePhotoUpload';

export default function InsuranceClaim({ buildingId }) {
  const [formData, setFormData] = useState({
    damage_type: '',
    description: '',
    estimated_cost: '',
    photos: []
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.BuildingTask.create({
        building_id: buildingId,
        task_title: `Versicherungsschaden: ${data.damage_type}`,
        description: data.description,
        task_type: 'repair',
        priority: 'high',
        estimated_cost: parseFloat(data.estimated_cost),
        attachments: data.photos,
        status: 'open',
        source_type: 'notification'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentTasks'] });
      toast.success('Versicherungsschaden gemeldet');
      setFormData({ damage_type: '', description: '', estimated_cost: '', photos: [] });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Versicherungsschaden
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Art des Schadens"
          value={formData.damage_type}
          onChange={(e) => setFormData({ ...formData, damage_type: e.target.value })}
        />
        <Textarea
          placeholder="Beschreibung..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
        <Input
          type="number"
          placeholder="Geschätzter Schaden (€)"
          value={formData.estimated_cost}
          onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
        />
        <MobilePhotoUpload
          onUploadComplete={(urls) => setFormData({ ...formData, photos: urls })}
          maxFiles={5}
        />
        <Button
          onClick={() => createMutation.mutate(formData)}
          disabled={!formData.damage_type}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Schaden melden
        </Button>
      </CardContent>
    </Card>
  );
}