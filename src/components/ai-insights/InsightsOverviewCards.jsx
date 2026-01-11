import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Wrench, TrendingUp, AlertTriangle } from 'lucide-react';

export default function InsightsOverviewCards({ companyId, buildings }) {
  const { data: communications = [] } = useQuery({
    queryKey: ['recent-communications', companyId],
    queryFn: () => base44.entities.TenantCommunication.filter({ company_id: companyId }, '-created_date', 30)
  });

  const { data: maintenanceTasks = [] } = useQuery({
    queryKey: ['maintenance-tasks-overview'],
    queryFn: () => base44.entities.MaintenanceTask.filter({ status: { $in: ['open', 'in_progress'] } }, '-created_date', 50)
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ['maintenance-predictions'],
    queryFn: () => base44.entities.MaintenancePrediction.filter({ status: 'pending' })
  });

  const { data: feedback = [] } = useQuery({
    queryKey: ['tenant-feedback', companyId],
    queryFn: () => base44.entities.TenantFeedback.filter({ company_id: companyId }, '-created_date', 20)
  });

  const avgFeedbackRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length).toFixed(1)
    : 'N/A';

  const criticalPredictions = predictions.filter(p => p.probability > 70).length;

  const stats = [
    {
      label: 'Kommunikationen (30 Tage)',
      value: communications.length,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Offene Wartungen',
      value: maintenanceTasks.length,
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Kritische Vorhersagen',
      value: criticalPredictions,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      label: 'Ø Mieter-Zufriedenheit',
      value: avgFeedbackRating,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}