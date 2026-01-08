import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, User, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ActivityLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterResource, setFilterResource] = useState('all');

  const { data: activities = [] } = useQuery({
    queryKey: ['user-activity'],
    queryFn: () => base44.asServiceRole.entities.UserActivity.list('-created_date', 100)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const filteredActivities = activities.filter(activity => {
    if (filterAction !== 'all' && activity.action_type !== filterAction) return false;
    if (filterResource !== 'all' && activity.resource !== filterResource) return false;
    
    if (searchQuery) {
      const user = users.find(u => u.id === activity.user_id);
      const userName = user?.full_name || user?.email || '';
      if (!userName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    
    return true;
  });

  const actionTypes = [...new Set(activities.map(a => a.action_type))];
  const resources = [...new Set(activities.map(a => a.resource))];

  const getActionColor = (action) => {
    switch (action) {
      case 'login': return 'bg-blue-100 text-blue-800';
      case 'logout': return 'bg-slate-100 text-slate-800';
      case 'entity_update': return 'bg-yellow-100 text-yellow-800';
      case 'entity_delete': return 'bg-red-100 text-red-800';
      case 'document_create': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1>
          <p className="text-slate-600">Benutzeraktivitäten überwachen</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Activity, label: "Gesamt Aktivitäten", value: activities.length, color: "blue" },
          { icon: User, label: "Aktive Benutzer", value: new Set(activities.map(a => a.user_id)).size, color: "green" },
          { icon: Activity, label: "Heute", value: activities.filter(a => {
            const activityDate = new Date(a.created_date);
            const today = new Date();
            return activityDate.toDateString() === today.toDateString();
          }).length, color: "purple" }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color !== 'blue' ? `text-${stat.color}-600` : ''}`}>
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
            </div>
          </CardContent>
        </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Benutzer suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Aktion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Aktionen</SelectItem>
                {actionTypes.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterResource} onValueChange={setFilterResource}>
              <SelectTrigger>
                <SelectValue placeholder="Ressource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Ressourcen</SelectItem>
                {resources.map(resource => (
                  <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
      <Card>
        <CardHeader>
          <CardTitle>Aktivitäten ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredActivities.map(activity => {
              const user = users.find(u => u.id === activity.user_id);
              return (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{user?.full_name || user?.email || 'Unknown'}</span>
                      <Badge className={getActionColor(activity.action_type)}>
                        {activity.action_type}
                      </Badge>
                      <span className="text-sm text-slate-600">{activity.resource}</span>
                    </div>
                    <div className="text-xs text-slate-500 ml-7 mt-1">
                      {format(new Date(activity.created_date), 'PPpp', { locale: de })} • 
                      IP: {activity.ip_address}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredActivities.length === 0 && (
              <p className="text-center text-slate-600 py-8">Keine Aktivitäten gefunden</p>
            )}
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}