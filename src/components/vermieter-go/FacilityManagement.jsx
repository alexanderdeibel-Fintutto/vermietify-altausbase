import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trash2, Snowflake, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function FacilityManagement({ buildingId }) {
  const queryClient = useQueryClient();

  const services = [
    { id: 'waste', label: 'Mülltonnen geleert', icon: Trash2, color: 'bg-green-600' },
    { id: 'snow', label: 'Winterdienst erledigt', icon: Snowflake, color: 'bg-blue-600' },
    { id: 'lawn', label: 'Rasen gemäht', icon: CheckCircle, color: 'bg-green-600' },
    { id: 'cleaning', label: 'Reinigung durchgeführt', icon: CheckCircle, color: 'bg-purple-600' }
  ];

  const logMutation = useMutation({
    mutationFn: async (serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return await base44.entities.BuildingTask.create({
        building_id: buildingId,
        task_title: service.label,
        task_type: 'cleaning',
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentTasks'] });
      toast.success('Service protokolliert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Facility Services</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {services.map(service => (
          <Button
            key={service.id}
            onClick={() => logMutation.mutate(service.id)}
            variant="outline"
            className="w-full justify-start h-auto py-3"
          >
            <service.icon className="w-4 h-4 mr-3" />
            <span className="flex-1 text-left">{service.label}</span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}