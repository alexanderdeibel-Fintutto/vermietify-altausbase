import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatGrid from '@/components/stats/StatGrid';
import { Users, Building2, FileText, TrendingUp, CreditCard, Calculator } from 'lucide-react';

export default function MetricsOverview() {
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.UserSubscription.list()
  });

  const { data: calculations = [] } = useQuery({
    queryKey: ['calculations'],
    queryFn: () => base44.entities.CalculationHistory.list()
  });

  const stats = [
    {
      label: 'Benutzer',
      value: users.length,
      icon: Users,
      variant: 'highlighted'
    },
    {
      label: 'Objekte',
      value: buildings.length,
      icon: Building2
    },
    {
      label: 'Aktive Abos',
      value: subscriptions.filter(s => s.status === 'ACTIVE').length,
      icon: CreditCard
    },
    {
      label: 'Berechnungen',
      value: calculations.length,
      icon: Calculator
    }
  ];

  return <StatGrid stats={stats} columns={4} />;
}