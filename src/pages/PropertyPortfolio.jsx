import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import PortfolioSummaryWidget from '@/components/widgets/PortfolioSummaryWidget';
import PropertyROIComparison from '@/components/realestate/PropertyROIComparison';
import MarketPriceValuation from '@/components/realestate/MarketPriceValuation';
import ROIDashboard from '@/components/financial-analysis/ROIDashboard';

export default function PropertyPortfolio() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Portfolio-Übersicht"
        subtitle="Gesamtansicht Ihrer Immobilien"
      />

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <PortfolioSummaryWidget />
        <PropertyROIComparison />
        <ROIDashboard />
      </div>
    </div>
  );
}