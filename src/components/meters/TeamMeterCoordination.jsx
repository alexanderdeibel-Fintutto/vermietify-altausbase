import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, UserCheck, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamMeterCoordination() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  const { data: managers = [] } = useQuery({
    queryKey: ['buildingManagers'],
    queryFn: () => base44.entities.BuildingManager.list(null, 100)
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['meterRoutes', selectedDate],
    queryFn: () => base44.entities.MeterReadingRoute.filter(
      { scheduled_date: selectedDate },
      'route_name',
      50
    )
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-name', 100)
  });

  const createRouteMutation = useMutation({
    mutationFn: async ({ buildingIds, assignedTo }) => {
      const response = await base44.functions.invoke('generateMeterReadingRoute', {
        building_ids: buildingIds,
        assigned_to: assignedTo,
        scheduled_date: selectedDate
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meterRoutes'] });
      toast.success('Route erstellt');
    }
  });

  const statusColors = {
    planned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team-Koordination
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Selector */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Datum</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Team Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {managers.filter(m => m.is_active).map(manager => {
              const managerRoutes = routes.filter(r => r.assigned_to === manager.user_email);
              const totalMeters = managerRoutes.reduce((acc, r) => acc + (r.total_meters || 0), 0);
              const completedMeters = managerRoutes.reduce((acc, r) => acc + (r.completed_meters || 0), 0);

              return (
                <Card key={manager.id} className="bg-slate-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2 mb-2">
                      <UserCheck className="w-4 h-4 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{manager.full_name}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {manager.role}
                        </Badge>
                      </div>
                    </div>
                    {managerRoutes.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-slate-600">
                          {completedMeters}/{totalMeters} Zähler
                        </p>
                        <p className="text-xs text-slate-600">
                          {managerRoutes.length} Route(n)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Routes for selected date */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Geplante Routen</CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length > 0 ? (
            <div className="space-y-3">
              {routes.map(route => (
                <div key={route.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{route.route_name}</p>
                      <p className="text-sm text-slate-600">
                        {managers.find(m => m.user_email === route.assigned_to)?.full_name}
                      </p>
                    </div>
                    <Badge className={statusColors[route.status]}>
                      {route.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>{route.completed_meters || 0}/{route.total_meters} Zähler</span>
                    <span>~{route.estimated_duration_minutes} Min</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-600 py-4">
              Keine Routen für dieses Datum
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}