import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import ModuleUsageChart from '@/components/analytics/ModuleUsageChart';
import UserActivityChart from '@/components/analytics/UserActivityChart';
import PerformanceMetrics from '@/components/analytics/PerformanceMetrics';
import PredictiveAnalytics from '@/components/analytics/PredictiveAnalytics';
import BenchmarkComparison from '@/components/analytics/BenchmarkComparison';

export default function Analytics() {
  return (
    <div className="p-6">
      <PageHeader
        title="Analytics"
        subtitle="Analysen und Kennzahlen im Überblick"
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <ModuleUsageChart />
        <UserActivityChart />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <PerformanceMetrics />
        <PredictiveAnalytics />
        <BenchmarkComparison 
          userValue={92}
          benchmarkValue={85}
          label="Auslastung"
        />
      </div>
    </div>
  );
}