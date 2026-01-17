import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PersonalDashboard from '@/components/dashboard/PersonalDashboard';
import SmartRecommendations from '@/components/analytics/SmartRecommendations';
import ContractRenewalTracker from '@/components/contracts/ContractRenewalTracker';
import DeadlineReminders from '@/components/automation/DeadlineReminders';

export default function ComprehensiveDashboard() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Willkommen zurück, {user?.full_name?.split(' ')[0]}!</h1>
        <p className="text-[var(--theme-text-secondary)] mt-1">
          {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <PersonalDashboard />

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <SmartRecommendations />
        <ContractRenewalTracker />
      </div>

      <div className="mt-6">
        <DeadlineReminders />
      </div>
    </div>
  );
}