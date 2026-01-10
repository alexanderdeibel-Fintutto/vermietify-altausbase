import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Plus, User } from 'lucide-react';
import { toast } from 'sonner';

export default function ViewingScheduler({ unitId }) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    visitor_name: '',
    visitor_phone: ''
  });
  const queryClient = useQueryClient();

  const { data: viewings = [] } = useQuery({
    queryKey: ['viewings', unitId],
    queryFn: async () => {
      // Use tasks as viewing appointments
      return await base44.entities.BuildingTask.filter(
        { 
          unit_id: unitId,
          task_type: 'administrative',
          task_title: { $regex: 'Besichtigung' }
        },
        '-due_date',
        20
      );
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.BuildingTask.create({
        unit_id: unitId,
        task_title: `Besichtigung: ${data.visitor_name}`,
        description: `Telefon: ${data.visitor_phone}`,
        task_type: 'administrative',
        due_date: `${data.date}T${data.time}`,
        status: 'assigned'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viewings'] });
      toast.success('Besichtigung geplant');
      setFormData({ date: '', time: '', visitor_name: '', visitor_phone: '' });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Besichtigungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-lg space-y-2">
          <Input
            type="text"
            placeholder="Name"
            value={formData.visitor_name}
            onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
          />
          <Input
            type="tel"
            placeholder="Telefon"
            value={formData.visitor_phone}
            onChange={(e) => setFormData({ ...formData, visitor_phone: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
            <Input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>
          <Button
            onClick={() => createMutation.mutate(formData)}
            disabled={!formData.visitor_name || !formData.date}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Termin anlegen
          </Button>
        </div>

        <div className="space-y-2">
          {viewings.map(viewing => (
            <div key={viewing.id} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{viewing.task_title}</p>
                  <p className="text-xs text-slate-600">{viewing.description}</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {new Date(viewing.due_date).toLocaleDateString('de-DE')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}