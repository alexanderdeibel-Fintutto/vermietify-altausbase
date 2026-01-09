import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { LogIn, LogOut, Eye, Pointer, AlertCircle, Zap } from 'lucide-react';

const activityIcons = {
  login: LogIn,
  logout: LogOut,
  page_visit: Eye,
  click: Pointer,
  problem_report: AlertCircle,
  error: AlertCircle
};

const activityLabels = {
  login: 'Login',
  logout: 'Logout',
  page_visit: 'Seite besucht',
  click: 'Klick',
  problem_report: 'Problem gemeldet',
  error: 'Fehler'
};

export default function TesterActivityFeed({ activities = [] }) {
  if (!activities || activities.length === 0) {
    return (
      <Card className="p-12 text-center border border-slate-200">
        <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-light">Noch keine Aktivitäten</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity, idx) => {
        const Icon = activityIcons[activity.activity_type] || Zap;
        const label = activityLabels[activity.activity_type] || activity.activity_type;

        return (
          <Card key={idx} className="p-4 border border-slate-100">
            <div className="flex gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 pt-1">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-slate-600" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge className="bg-slate-100 text-slate-700">{label}</Badge>
                    {activity.page_title && (
                      <p className="text-sm font-light text-slate-700 mt-1">{activity.page_title}</p>
                    )}
                  </div>
                  <span className="text-xs font-light text-slate-400">
                    {format(new Date(activity.timestamp), 'HH:mm:ss', { locale: de })}
                  </span>
                </div>

                {/* Details */}
                {activity.page_url && (
                  <p className="text-xs font-light text-slate-500 truncate">{activity.page_url}</p>
                )}
                
                {activity.element_text && (
                  <p className="text-xs font-light text-slate-500 mt-1">
                    Element: "{activity.element_text.substring(0, 50)}"
                  </p>
                )}

                {activity.error_message && (
                  <p className="text-xs font-light text-red-600 mt-1">{activity.error_message}</p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}