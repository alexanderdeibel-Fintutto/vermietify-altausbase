import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import TrendAnalysis from '@/components/analytics/TrendAnalysis';
import MarketBenchmarking from '@/components/analytics/MarketBenchmarking';
import ConversionTracker from '@/components/analytics/ConversionTracker';
import OnboardingFunnelTracker from '@/components/analytics/OnboardingFunnelTracker';
import ModuleUsageChart from '@/components/analytics/ModuleUsageChart';

export default function AnalyticsHub() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Analytics-Hub"
        subtitle="Umfassende Einblicke in Ihre Daten"
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <TrendAnalysis />
        <MarketBenchmarking />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <ConversionTracker />
        <OnboardingFunnelTracker />
        <ModuleUsageChart />
      </div>
    </div>
  );
}