import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import PropertyROIComparison from '@/components/realestate/PropertyROIComparison';
import VacancyCostCalculator from '@/components/realestate/VacancyCostCalculator';
import RegionalMarketAnalysis from '@/components/realestate/RegionalMarketAnalysis';

import RealtimeCashflowMonitor from '@/components/finance/RealtimeCashflowMonitor';
import BudgetAlertManager from '@/components/finance/BudgetAlertManager';
import CostCenterAccounting from '@/components/finance/CostCenterAccounting';
import ProfitLossForecast from '@/components/finance/ProfitLossForecast';

import TenantScoring from '@/components/tenants/TenantScoring';
import AutomatedReminderFlow from '@/components/tenants/AutomatedReminderFlow';
import DepositManager from '@/components/tenants/DepositManager';
import ContractRenewalAssistant from '@/components/tenants/ContractRenewalAssistant';

import QuarterlyReportGenerator from '@/components/reporting/QuarterlyReportGenerator';
import PlanVsActualComparison from '@/components/reporting/PlanVsActualComparison';
import CustomReportDesigner from '@/components/reporting/CustomReportDesigner';

import GPSLocationTracker from '@/components/mobile/GPSLocationTracker';
import OfflineSyncManager from '@/components/mobile/OfflineSyncManager';
import BarcodeReceiptScanner from '@/components/mobile/BarcodeReceiptScanner';

import SlackNotifications from '@/components/integrations/SlackNotifications';
import DATEVInterface from '@/components/integrations/DATEVInterface';
import BankingAutoSync from '@/components/integrations/BankingAutoSync';

import PredictiveAnalytics from '@/components/analytics/PredictiveAnalytics';
import MarketBenchmarking from '@/components/analytics/MarketBenchmarking';
import PortfolioRiskAnalysis from '@/components/analytics/PortfolioRiskAnalysis';
import TaxOptimizationAutopilot from '@/components/analytics/TaxOptimizationAutopilot';

export default function CompleteEnterpriseHub() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Enterprise Features</h1>

      <Tabs defaultValue="realestate">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="realestate">Immobilien</TabsTrigger>
          <TabsTrigger value="finance">Controlling</TabsTrigger>
          <TabsTrigger value="tenants">Mieter</TabsTrigger>
          <TabsTrigger value="reporting">Reports</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="integrations">Integrationen</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="realestate" className="space-y-6">
          <PropertyROIComparison />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VacancyCostCalculator />
            <RegionalMarketAnalysis />
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <RealtimeCashflowMonitor />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetAlertManager />
            <CostCenterAccounting />
          </div>
          <ProfitLossForecast />
        </TabsContent>

        <TabsContent value="tenants" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TenantScoring tenantId="example" />
            <AutomatedReminderFlow />
            <DepositManager />
            <ContractRenewalAssistant />
          </div>
        </TabsContent>

        <TabsContent value="reporting" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QuarterlyReportGenerator />
            <CustomReportDesigner />
          </div>
          <PlanVsActualComparison />
        </TabsContent>

        <TabsContent value="mobile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GPSLocationTracker />
            <OfflineSyncManager />
            <BarcodeReceiptScanner />
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SlackNotifications />
            <DATEVInterface />
            <BankingAutoSync />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PredictiveAnalytics />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MarketBenchmarking />
            <PortfolioRiskAnalysis />
          </div>
          <TaxOptimizationAutopilot />
        </TabsContent>
      </Tabs>
    </div>
  );
}