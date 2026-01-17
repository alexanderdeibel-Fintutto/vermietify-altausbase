import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import ContractRenewalTracker from '@/components/contracts/ContractRenewalTracker';
import VacancyForecast from '@/components/property-management/VacancyForecast';
import VacancyCostCalculator from '@/components/realestate/VacancyCostCalculator';
import RenovationPlanner from '@/components/realestate/RenovationPlanner';

export default function PropertyManagementHub() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Objektverwaltung"
        subtitle="Professionelle Tools für Ihre Immobilien"
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <ContractRenewalTracker />
        <VacancyForecast />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <VacancyCostCalculator />
        <RenovationPlanner />
      </div>
    </div>
  );
}