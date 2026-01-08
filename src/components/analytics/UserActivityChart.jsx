import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function UserActivityChart({ timeRange = 7 }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['user-activities', timeRange],
    queryFn: () => base44.asServiceRole.entities.UserActivity.list('-created_date', 1000)
  });

  // Group by day
  const activityByDay = activities.reduce((acc, activity) => {
    const date = new Date(activity.created_date).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, count: 0, logins: 0, updates: 0, apiCalls: 0 };
    }
    acc[date].count++;
    if (activity.action_type === 'login') acc[date].logins++;
    if (activity.action_type === 'entity_update') acc[date].updates++;
    if (activity.action_type === 'api_call') acc[date].apiCalls++;
    return acc;
  }, {});

  const chartData = Object.values(activityByDay)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-timeRange);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Aktivitäts-Trend (letzte {timeRange} Tage)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(date) => new Date(date).toLocaleDateString('de-DE')}
            />
            <Bar dataKey="count" fill="#10b981" name="Gesamt" />
            <Bar dataKey="logins" fill="#3b82f6" name="Logins" />
            <Bar dataKey="updates" fill="#f59e0b" name="Updates" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}