import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import OnboardingResumeCard from '@/components/dashboard/OnboardingResumeCard';
import QuickStatsWidget from '@/components/dashboard/widgets/QuickStatsWidget';
import FeatureShowcase from '@/components/demo/FeatureShowcase';

export default function WelcomeDashboard() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const isNewUser = buildings.length === 0;

  if (isNewUser) {
    return <WelcomeScreen onStart={() => {}} />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Willkommen zurück, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-[var(--theme-text-secondary)]">
          Hier ist Ihr Überblick für heute
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <QuickStatsWidget />
        </div>
        <OnboardingResumeCard />
      </div>

      <FeatureShowcase />
    </div>
  );
}