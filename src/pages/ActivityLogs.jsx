import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Download, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ActivityLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');

  const { data: activities = [], refetch, isLoading } = useQuery({
    queryKey: ['activity-logs', timeRange],
    queryFn: async () => {
      const acts = await base44.asServiceRole.entities.UserActivity.list('-created_date');
      
      // Filter by time range
      const now = new Date();
      const ranges = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      const cutoff = new Date(now - ranges[timeRange]);
      return acts.filter(a => new Date(a.created_date) >= cutoff);
    },
    refetchInterval: 30000
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (searchTerm && !activity.resource.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterUser !== 'all' && activity.user_id !== filterUser) {
      return false;
    }
    if (filterAction !== 'all' && activity.action_type !== filterAction) {
      return false;
    }
    return true;
  });

  // Statistics
  const actionCounts = {};
  activities.forEach(a => {
    actionCounts[a.action_type] = (actionCounts[a.action_type] || 0) + 1;
  });

  const uniqueUsers = new Set(activities.map(a => a.user_id)).size;

  const handleExport = async () => {
    const csv = [
      ['Zeitstempel', 'Benutzer', 'Aktion', 'Ressource', 'IP-Adresse'].join(','),
      ...filteredActivities.map(a => {
        const user = users.find(u => u.id === a.user_id);
        return [
          format(new Date(a.created_date), 'dd.MM.yyyy HH:mm:ss'),
          user?.email || 'Unbekannt',
          a.action_type,
          a.resource,
          a.ip_address || ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionBadgeColor = (actionType) => {
    const colors = {
      'login': 'bg-green-100 text-green-800',
      'logout': 'bg-gray-100 text-gray-800',
      'page_view': 'bg-blue-100 text-blue-800',
      'form_submit': 'bg-purple-100 text-purple-800',
      'api_call': 'bg-orange-100 text-orange-800',
      'document_create': 'bg-indigo-100 text-indigo-800',
      'entity_update': 'bg-yellow-100 text-yellow-800',
      'entity_delete': 'bg-red-100 text-red-800'
    };
    return colors[actionType] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1>
          <p className="text-slate-600">Übersicht aller Benutzer-Aktivitäten</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Aktualisieren
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            CSV Export
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Gesamt Aktivitäten</div>
                <div className="text-3xl font-bold text-blue-600">{activities.length}</div>
              </div>
              <Activity className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <div className="text-sm text-slate-600">Aktive Benutzer</div>
              <div className="text-3xl font-bold text-green-600">{uniqueUsers}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <div className="text-sm text-slate-600">Häufigste Aktion</div>
              <div className="text-2xl font-bold text-purple-600">
                {Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <div className="text-sm text-slate-600">Zeitraum</div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Letzte Stunde</SelectItem>
                  <SelectItem value="24h">Letzte 24h</SelectItem>
                  <SelectItem value="7d">Letzte 7 Tage</SelectItem>
                  <SelectItem value="30d">Letzte 30 Tage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Nach Ressource suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Benutzer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Benutzer</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Aktion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Aktionen</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="page_view">Seitenaufruf</SelectItem>
                <SelectItem value="form_submit">Formular</SelectItem>
                <SelectItem value="entity_update">Update</SelectItem>
                <SelectItem value="entity_delete">Löschen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitäten ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-slate-600">Lädt...</div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-slate-600">Keine Aktivitäten gefunden</div>
            ) : (
              filteredActivities.map((activity) => {
                const user = users.find(u => u.id === activity.user_id);
                return (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-sm text-slate-500 w-32">
                        {format(new Date(activity.created_date), 'dd.MM HH:mm:ss', { locale: de })}
                      </div>
                      <div className="w-48">
                        <div className="font-medium text-sm">{user?.full_name || user?.email || 'Unbekannt'}</div>
                        <div className="text-xs text-slate-500">{user?.email}</div>
                      </div>
                      <Badge className={getActionBadgeColor(activity.action_type)}>
                        {activity.action_type}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{activity.resource}</div>
                        {activity.resource_id && (
                          <div className="text-xs text-slate-500">ID: {activity.resource_id}</div>
                        )}
                      </div>
                      {activity.ip_address && (
                        <div className="text-xs text-slate-500">{activity.ip_address}</div>
                      )}
                      {activity.duration && (
                        <div className="text-xs text-slate-500">{activity.duration}ms</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}