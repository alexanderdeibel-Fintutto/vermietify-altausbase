import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import QuickStatsGrid from '@/components/shared/QuickStatsGrid';
import { CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';

export default function TaskStats() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const completed = tasks.filter(t => t.status === 'Erledigt').length;
  const pending = tasks.filter(t => t.status === 'Offen').length;
  const overdue = tasks.filter(t => {
    if (!t.faelligkeitsdatum) return false;
    return new Date(t.faelligkeitsdatum) < new Date() && t.status !== 'Erledigt';
  }).length;

  const stats = [
    { label: 'Erledigt', value: completed, icon: CheckCircle, variant: 'default' },
    { label: 'Offen', value: pending, icon: Clock },
    { label: 'Überfällig', value: overdue, icon: AlertCircle },
    { label: 'Gesamt', value: tasks.length, icon: TrendingUp }
  ];

  return <QuickStatsGrid stats={stats} />;
}