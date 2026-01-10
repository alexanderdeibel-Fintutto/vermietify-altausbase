import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import UniversalImporter from '@/components/import/UniversalImporter';
import MultiFormatExporter from '@/components/export/MultiFormatExporter';
import FullTextSearch from '@/components/search/FullTextSearch';
import SavedSearches from '@/components/search/SavedSearches';
import APIKeyManager from '@/components/api/APIKeyManager';
import WebhookManager from '@/components/api/WebhookManager';
import FiveYearPlan from '@/components/planning/FiveYearPlan';
import BudgetScenarioPlanner from '@/components/planning/BudgetScenarioPlanner';
import LiquidityForecast from '@/components/planning/LiquidityForecast';
import InvestmentPlanner from '@/components/planning/InvestmentPlanner';
import MarketPriceValuation from '@/components/realestate/MarketPriceValuation';
import RentAdjustmentCalculator from '@/components/realestate/RentAdjustmentCalculator';
import EnergyEfficiencyTracker from '@/components/realestate/EnergyEfficiencyTracker';
import RenovationPlanner from '@/components/realestate/RenovationPlanner';
import LiveTaxCalculator from '@/components/tax/LiveTaxCalculator';
import TaxDeclarationWizard from '@/components/tax/TaxDeclarationWizard';
import ScenarioComparator from '@/components/tax/ScenarioComparator';
import PlausibilityChecker from '@/components/tax/PlausibilityChecker';
import InAppChatSupport from '@/components/support/InAppChatSupport';
import VideoTutorials from '@/components/support/VideoTutorials';
import AIAssistant from '@/components/support/AIAssistant';
import ContextualHelp from '@/components/support/ContextualHelp';
import WorkflowBuilder from '@/components/automation/WorkflowBuilder';
import RuleBasedActions from '@/components/automation/RuleBasedActions';
import IntelligentSuggestions from '@/components/automation/IntelligentSuggestions';

export default function CompleteFeaturesHub() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Alle Features</h1>

      <Tabs defaultValue="import">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="import">Import/Export</TabsTrigger>
          <TabsTrigger value="search">Suche</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="planning">Planung</TabsTrigger>
          <TabsTrigger value="realestate">Immobilien</TabsTrigger>
          <TabsTrigger value="tax">Steuer</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UniversalImporter />
            <MultiFormatExporter />
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FullTextSearch />
            <SavedSearches />
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <APIKeyManager />
            <WebhookManager />
          </div>
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          <FiveYearPlan />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetScenarioPlanner />
            <LiquidityForecast />
          </div>
          <InvestmentPlanner />
        </TabsContent>

        <TabsContent value="realestate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MarketPriceValuation buildingId="example" />
            <RentAdjustmentCalculator />
            <EnergyEfficiencyTracker buildingId="example" />
            <RenovationPlanner />
          </div>
        </TabsContent>

        <TabsContent value="tax" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LiveTaxCalculator />
            <TaxDeclarationWizard />
          </div>
          <ScenarioComparator />
          <PlausibilityChecker />
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InAppChatSupport />
            <VideoTutorials />
          </div>
          <AIAssistant />
          <WorkflowBuilder />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RuleBasedActions />
            <IntelligentSuggestions />
          </div>
        </TabsContent>
      </Tabs>

      <ContextualHelp context="general" />
    </div>
  );
}