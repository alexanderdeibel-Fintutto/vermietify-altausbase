import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, User, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const getActivityIcon = (type) => {
  switch (type) {
    case 'create': return CheckCircle;
    case 'update': return FileText;
    case 'delete': return AlertCircle;
    case 'comment': return User;
    default: return Clock;
  }
};

const getActivityColor = (type) => {
  switch (type) {
    case 'create': return 'text-green-600';
    case 'update': return 'text-blue-600';
    case 'delete': return 'text-red-600';
    case 'comment': return 'text-purple-600';
    default: return 'text-slate-600';
  }
};

export default function ActivityTimeline({ activities = [], maxItems = 10 }) {
  const recentActivities = activities.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Aktivitätsverlauf
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />

          {recentActivities.map((activity, idx) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <motion.div
                key={activity.id || idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative pl-10"
              >
                {/* Icon */}
                <div className={`absolute left-0 w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-slate-900">
                      {activity.title}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                  
                  {activity.description && (
                    <p className="text-xs text-slate-600 mb-2">
                      {activity.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {activity.user || 'System'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(activity.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {activities.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            Keine Aktivitäten vorhanden
          </p>
        )}
      </CardContent>
    </Card>
  );
}