import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Activity, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AuditTrailVisualization() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');

  const { data: activities = [] } = useQuery({
    queryKey: ['user-activities'],
    queryFn: () => base44.asServiceRole.entities.UserActivity.list('-created_date', 100)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const filteredActivities = activities.filter(activity => {
    if (filterAction !== 'all' && activity.action_type !== filterAction) return false;
    if (filterUser !== 'all' && activity.user_id !== filterUser) return false;
    if (searchQuery && !activity.resource?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const actionColors = {
    'login': 'bg-green-100 text-green-800',
    'logout': 'bg-slate-100 text-slate-800',
    'entity_update': 'bg-blue-100 text-blue-800',
    'entity_delete': 'bg-red-100 text-red-800',
    'api_call': 'bg-purple-100 text-purple-800',
    'form_submit': 'bg-yellow-100 text-yellow-800'
  };

  const groupedByTime = filteredActivities.reduce((acc, activity) => {
    const date = format(new Date(activity.created_date), 'dd.MM.yyyy', { locale: de });
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Audit Trail ({filteredActivities.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
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
              <SelectItem value="entity_update">Update</SelectItem>
              <SelectItem value="entity_delete">Delete</SelectItem>
              <SelectItem value="api_call">API Call</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Benutzer</SelectItem>
              {users.slice(0, 20).map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {Object.entries(groupedByTime).map(([date, dateActivities]) => (
            <div key={date}>
              <div className="sticky top-0 bg-white z-10 py-2 border-b mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {date}
                  <Badge variant="outline">{dateActivities.length} Aktivitäten</Badge>
                </div>
              </div>
              <div className="space-y-2 pl-6">
                {dateActivities.map(activity => {
                  const user = users.find(u => u.id === activity.user_id);
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={actionColors[activity.action_type] || 'bg-slate-100'}>
                            {activity.action_type}
                          </Badge>
                          <span className="font-medium text-sm">{activity.resource}</span>
                          {activity.resource_id && (
                            <span className="text-xs text-slate-500">#{activity.resource_id}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {user?.full_name || user?.email || 'Unknown'}
                          </div>
                          <div>
                            {format(new Date(activity.created_date), 'HH:mm:ss', { locale: de })}
                          </div>
                          {activity.ip_address && (
                            <div>IP: {activity.ip_address}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}