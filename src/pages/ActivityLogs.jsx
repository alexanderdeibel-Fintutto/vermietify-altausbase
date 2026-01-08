import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import ActivityLogFilterBar from '@/components/audit/ActivityLogFilterBar';
import ActivityLogTable from '@/components/audit/ActivityLogTable';
import QuickStats from '@/components/shared/QuickStats';

export default function ActivityLogsPage() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const { data: activities = [] } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: () => base44.entities.UserActivity?.list?.() || []
  });

  const filteredActivities = activities.filter(a => {
    const matchesSearch = (a.user_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesAction = action === 'all' || a.action === action;
    return matchesSearch && matchesAction;
  });

  const createCount = activities.filter(a => a.action === 'create').length;
  const updateCount = activities.filter(a => a.action === 'update').length;
  const deleteCount = activities.filter(a => a.action === 'delete').length;

  const stats = [
    { label: 'Gesamtaktionen', value: activities.length },
    { label: 'Erstellt', value: createCount },
    { label: 'Aktualisiert', value: updateCount },
    { label: 'Gelöscht', value: deleteCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">📜 Aktivitätsprotokolle</h1>
        <p className="text-slate-600 mt-1">Überwachen Sie alle Benutzeraktivitäten und Änderungen</p>
      </div>
      <QuickStats stats={stats} accentColor="slate" />
      <ActivityLogFilterBar onSearchChange={setSearch} onActionChange={setAction} onDateChange={setDateRange} />
      <ActivityLogTable activities={filteredActivities} />
    </div>
  );
}