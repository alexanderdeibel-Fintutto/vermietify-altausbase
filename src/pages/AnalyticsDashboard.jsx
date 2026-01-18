import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import FeatureUsageTracker from '@/components/analytics/FeatureUsageTracker';
import UsageAnalyticsWidget from '@/components/analytics/UsageAnalyticsWidget';
import UserActivityChart from '@/components/analytics/UserActivityChart';
import TrendAnalysis from '@/components/analytics/TrendAnalysis';

export default function AnalyticsDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Analytics"
        subtitle="Nutzungsstatistiken und Trends"
      />

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <UsageAnalyticsWidget />
        <UserActivityChart />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <FeatureUsageTracker />
        <TrendAnalysis />
      </div>
    </div>
  );
}