import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ActivityLogViewer({ userId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const { data: activities = [] } = useQuery({
    queryKey: ['user-activities', userId],
    queryFn: () => base44.asServiceRole.entities.UserActivity.filter({ user_id: userId }),
    enabled: !!userId
  });

  const filteredActivities = activities.filter(activity => {
    if (filterAction !== 'all' && activity.action_type !== filterAction) return false;
    if (searchQuery && !activity.resource?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const actionColors = {
    'login': 'bg-green-100 text-green-800',
    'logout': 'bg-slate-100 text-slate-800',
    'page_view': 'bg-blue-100 text-blue-800',
    'form_submit': 'bg-purple-100 text-purple-800',
    'api_call': 'bg-orange-100 text-orange-800',
    'entity_update': 'bg-yellow-100 text-yellow-800',
    'entity_delete': 'bg-red-100 text-red-800'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Aktivitäten ({filteredActivities.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Ressource suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Aktionen</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="page_view">Seitenaufruf</SelectItem>
              <SelectItem value="entity_update">Update</SelectItem>
              <SelectItem value="entity_delete">Löschen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredActivities.map(activity => (
            <div key={activity.id} className="p-3 border rounded-lg hover:bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <Badge className={actionColors[activity.action_type] || 'bg-slate-100 text-slate-800'}>
                  {activity.action_type}
                </Badge>
                <span className="text-xs text-slate-500">
                  {format(new Date(activity.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">{activity.resource}</span>
                {activity.resource_id && (
                  <span className="text-slate-500 ml-2">#{activity.resource_id}</span>
                )}
              </div>
              {activity.ip_address && (
                <div className="text-xs text-slate-500 mt-1">
                  IP: {activity.ip_address}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}