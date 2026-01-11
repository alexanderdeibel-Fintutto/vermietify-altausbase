import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckSquare, Play } from 'lucide-react';

export default function MaintenanceRoutePlanner({ companyId }) {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const { data: routes = [] } = useQuery({
    queryKey: ['routes', companyId],
    queryFn: () => base44.asServiceRole.entities.MaintenanceRoute.filter({ company_id: companyId })
  });

  const generateMutation = useMutation({
    mutationFn: (routeId) =>
      base44.functions.invoke('generateMaintenanceRoute', { route_id: routeId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routes'] })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Hausmeister-Touren
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {routes.map(route => (
          <div key={route.id} className="p-3 border rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{route.name}</span>
              <Badge>{route.schedule}</Badge>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              {route.buildings?.length || 0} Gebäude • {route.checklist_items?.length || 0} Aufgaben
            </p>
            <Button
              size="sm"
              onClick={() => generateMutation.mutate(route.id)}
              className="w-full gap-1"
            >
              <Play className="w-3 h-3" />
              Tour starten
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}