import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import TrendAnalysis from '@/components/analytics/TrendAnalysis';
import PredictiveAnalytics from '@/components/analytics/PredictiveAnalytics';
import PaymentAnalysis from '@/components/reports/PaymentAnalysis';
import UserActivityChart from '@/components/analytics/UserActivityChart';

export default function AdvancedAnalytics() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Erweiterte Analytics"
        subtitle="Datengestützte Einblicke in Ihr Portfolio"
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <TrendAnalysis />
        <PredictiveAnalytics />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <PaymentAnalysis />
        <UserActivityChart />
      </div>
    </div>
  );
}