import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

import PredictiveAnalytics from '@/components/analytics/PredictiveAnalytics';
import MarketBenchmarking from '@/components/analytics/MarketBenchmarking';
import PortfolioRiskAnalysis from '@/components/analytics/PortfolioRiskAnalysis';
import TaxOptimizationAutopilot from '@/components/analytics/TaxOptimizationAutopilot';

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

import PropertyROIComparison from '@/components/realestate/PropertyROIComparison';
import VacancyCostCalculator from '@/components/realestate/VacancyCostCalculator';
import RegionalMarketAnalysis from '@/components/realestate/RegionalMarketAnalysis';

import BarcodeReceiptScanner from '@/components/mobile/BarcodeReceiptScanner';
import VoiceNoteCapture from '@/components/mobile/VoiceNoteCapture';
import GPSMileageTracker from '@/components/mobile/GPSMileageTracker';

import FinAPIBankingSync from '@/components/integrations/FinAPIBankingSync';
import CryptoExchangeSync from '@/components/integrations/CryptoExchangeSync';
import DATEVInterface from '@/components/integrations/DATEVInterface';
import ESignaturePanel from '@/components/integrations/ESignaturePanel';

import QuickActionsMenu from '@/components/dashboard/QuickActionsMenu';
import InAppChatSupport from '@/components/support/InAppChatSupport';
import InteractiveFeatureTour from '@/components/onboarding/InteractiveFeatureTour';
import AdvancedSearchBuilder from '@/components/search/AdvancedSearchBuilder';

import TwoFactorAuth from '@/components/security/TwoFactorAuth';
import AuditLog from '@/components/security/AuditLog';
import GDPRDataExport from '@/components/security/GDPRDataExport';
import EndToEndEncryption from '@/components/security/EndToEndEncryption';
import FieldPermissions from '@/components/security/FieldPermissions';

export default function CompleteEnterpriseHub() {
  const [showTour, setShowTour] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Complete Enterprise Hub</h1>
          <p className="text-slate-600">Alle Advanced Enterprise-Features</p>
        </div>
        <Button onClick={() => setShowTour(true)} className="bg-purple-600">
          <Sparkles className="w-4 h-4 mr-2" />
          Feature-Tour starten
        </Button>
      </div>

      {showTour && <InteractiveFeatureTour onClose={() => setShowTour(false)} />}

      <Tabs defaultValue="analytics">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="tenants">Mieter</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="realestate">Immobilien</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="integrations">Integrationen</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PredictiveAnalytics />
            <MarketBenchmarking />
            <PortfolioRiskAnalysis />
            <TaxOptimizationAutopilot />
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

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QuarterlyReportGenerator />
            <PlanVsActualComparison />
          </div>
          <CustomReportDesigner />
        </TabsContent>

        <TabsContent value="realestate" className="space-y-6">
          <PropertyROIComparison />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VacancyCostCalculator />
            <RegionalMarketAnalysis />
          </div>
        </TabsContent>

        <TabsContent value="mobile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <BarcodeReceiptScanner />
            <VoiceNoteCapture />
            <GPSMileageTracker />
          </div>
          <QuickActionsMenu />
          <AdvancedSearchBuilder />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinAPIBankingSync />
            <CryptoExchangeSync />
            <DATEVInterface />
            <ESignaturePanel />
          </div>
          <InAppChatSupport />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TwoFactorAuth />
            <EndToEndEncryption />
            <AuditLog />
            <GDPRDataExport />
          </div>
          <FieldPermissions />
        </TabsContent>
      </Tabs>
    </div>
  );
}