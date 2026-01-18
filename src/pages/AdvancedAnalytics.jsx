import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import PredictiveAnalytics from '@/components/analytics/PredictiveAnalytics';
import UserActivityChart from '@/components/analytics/UserActivityChart';
import PerformanceMetrics from '@/components/analytics/PerformanceMetrics';
import TrendAnalysis from '@/components/analytics/TrendAnalysis';

export default function AdvancedAnalytics() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Erweiterte Analysen"
        subtitle="KI-gestützte Einblicke und Vorhersagen"
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <PredictiveAnalytics />
        <UserActivityChart />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <PerformanceMetrics />
        <TrendAnalysis />
      </div>
    </div>
  );
}