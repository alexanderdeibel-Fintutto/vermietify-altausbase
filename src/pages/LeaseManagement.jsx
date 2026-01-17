import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import ContractRenewalTracker from '@/components/contracts/ContractRenewalTracker';
import RentIncreaseCalculator from '@/components/contracts/RentIncreaseCalculator';
import RentChangeHistory from '@/components/contracts/RentChangeHistory';
import DepositManager from '@/components/tenants/DepositManager';

export default function LeaseManagement() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Mietverwaltung"
        subtitle="Verwalten Sie Verträge, Mieten und Kautionen"
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <ContractRenewalTracker />
        <RentIncreaseCalculator />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <RentChangeHistory contractId="sample" />
        <DepositManager contract={{ deposit_amount: 1700, deposit_status: 'received' }} />
      </div>
    </div>
  );
}