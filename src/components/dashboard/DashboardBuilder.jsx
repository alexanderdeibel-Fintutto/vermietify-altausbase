import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Layout, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardBuilder() {
  const queryClient = useQueryClient();

  const { data: widgets } = useQuery({
    queryKey: ['dashboardWidgets'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getDashboardWidgets', {});
      return response.data.widgets;
    }
  });

  const [selected, setSelected] = useState([]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('saveDashboardWidgets', { widgets: selected });
    },
    onSuccess: () => {
      toast.success('Dashboard gespeichert');
    }
  });

  const availableWidgets = [
    { id: 'stats', name: 'Statistiken' },
    { id: 'revenue', name: 'Umsatz-Chart' },
    { id: 'tasks', name: 'Aufgaben' },
    { id: 'tenants', name: 'Mieter-Übersicht' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="w-5 h-5" />
          Dashboard anpassen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableWidgets.map(widget => (
          <div key={widget.id} className="flex items-center gap-2">
            <Checkbox 
              checked={selected.includes(widget.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelected([...selected, widget.id]);
                } else {
                  setSelected(selected.filter(id => id !== widget.id));
                }
              }}
            />
            <span className="text-sm">{widget.name}</span>
          </div>
        ))}
        <Button onClick={() => saveMutation.mutate()} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Speichern
        </Button>
      </CardContent>
    </Card>
  );
}