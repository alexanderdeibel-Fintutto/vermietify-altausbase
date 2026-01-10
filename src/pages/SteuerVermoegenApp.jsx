import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  TrendingUp, 
  Building2, 
  Receipt, 
  PieChart,
  Calculator,
  FileText,
  Landmark,
  Wallet
} from 'lucide-react';

// Wealth Components
import AssetPortfolioTable from '@/components/wealth/AssetPortfolioTable';
import PortfolioKPICards from '@/components/wealth/PortfolioKPICards';
import PerformanceChart from '@/components/wealth/PerformanceChart';
import TaxCockpit from '@/components/wealth/TaxCockpit';

// Tax Components
import ComprehensiveTaxDashboard from '@/components/tax/ComprehensiveTaxDashboard';
import TaxOptimizationPanel from '@/components/tax/TaxOptimizationPanel';
import TaxCalculationDisplay from '@/components/tax/TaxCalculationDisplay';

// Property Components
import BuildingTable from '@/components/buildings/BuildingTable';
import BuildingSummary from '@/components/buildings/BuildingSummary';

// Financial Components
import FinancialItemTable from '@/components/financial-items/FinancialItemTable';
import BudgetTracker from '@/components/finance/BudgetTracker';
import CashflowForecast from '@/components/finance/CashflowForecast';

// Document Components
import DocumentsList from '@/components/documents/DocumentsList';

// Tax-Property Components
import PropertyTaxOverview from '@/components/tax-property/PropertyTaxOverview';
import WealthAllocationChart from '@/components/tax-property/WealthAllocationChart';
import TaxOptimizationRecommendations from '@/components/tax-property/TaxOptimizationRecommendations';
import AnlageVQuickGenerator from '@/components/tax-property/AnlageVQuickGenerator';
import AfACalculator from '@/components/tax-property/AfACalculator';
import InvestmentAnalysis from '@/components/tax-property/InvestmentAnalysis';
import ElsterDirectSubmit from '@/components/tax-property/ElsterDirectSubmit';
import QuarterlyTaxCalculator from '@/components/tax-property/QuarterlyTaxCalculator';
import LossCarryforwardTracker from '@/components/tax-property/LossCarryforwardTracker';
import ExpenseScanner from '@/components/tax-property/ExpenseScanner';
import MileageLogger from '@/components/tax-property/MileageLogger';
import BusinessTripTracker from '@/components/tax-property/BusinessTripTracker';
import DoubleTaxCalculator from '@/components/tax-property/DoubleTaxCalculator';
import TaxAdvisorInterface from '@/components/tax-property/TaxAdvisorInterface';
import RebalancingAssistant from '@/components/tax-property/RebalancingAssistant';
import DiversificationScore from '@/components/tax-property/DiversificationScore';
import RiskAssessment from '@/components/tax-property/RiskAssessment';
import PerformanceAttribution from '@/components/tax-property/PerformanceAttribution';
import DividendCalendar from '@/components/tax-property/DividendCalendar';
import CompoundInterestCalculator from '@/components/tax-property/CompoundInterestCalculator';
import RetirementPlanner from '@/components/tax-property/RetirementPlanner';
import WealthSimulator from '@/components/tax-property/WealthSimulator';
import FinancingCalculator from '@/components/tax-property/FinancingCalculator';
import EquityReturnAnalysis from '@/components/tax-property/EquityReturnAnalysis';
import CashflowSimulation from '@/components/tax-property/CashflowSimulation';
import PropertyComparison from '@/components/tax-property/PropertyComparison';
import RenovationROI from '@/components/tax-property/RenovationROI';
import InsuranceOverview from '@/components/tax-property/InsuranceOverview';
import PropertyTaxCalculator from '@/components/tax-property/PropertyTaxCalculator';
import GoBDArchive from '@/components/tax-property/GoBDArchive';
import RetentionTracker from '@/components/tax-property/RetentionTracker';
import AuditPreparation from '@/components/tax-property/AuditPreparation';
import TaxDeclarationChecklist from '@/components/tax-property/TaxDeclarationChecklist';
import DeadlineTrafficLight from '@/components/tax-property/DeadlineTrafficLight';
import FinAPISyncPanel from '@/components/tax-property/FinAPISyncPanel';
import AICategorizationEngine from '@/components/tax-property/AICategorizationEngine';
import RecurringBookings from '@/components/tax-property/RecurringBookings';
import SmartAlerts from '@/components/tax-property/SmartAlerts';
import BatchImport from '@/components/tax-property/BatchImport';
import DocumentUploadManager from '@/components/tax-property/DocumentUploadManager';
import BulkDocumentUpload from '@/components/tax-property/BulkDocumentUpload';
import DocumentSearchEngine from '@/components/tax-property/DocumentSearchEngine';
import TaxDocumentGallery from '@/components/tax-property/TaxDocumentGallery';
import SmartFilingAssistant from '@/components/tax-property/SmartFilingAssistant';
import QuickActionsPanel from '@/components/tax-property/QuickActionsPanel';
import TaxYearOverview from '@/components/tax-property/TaxYearOverview';
import FinancialSummaryCards from '@/components/tax-property/FinancialSummaryCards';
import MonthlyTaxEstimate from '@/components/tax-property/MonthlyTaxEstimate';
import TaxSavingsTips from '@/components/tax-property/TaxSavingsTips';
import ComplianceMonitor from '@/components/tax-property/ComplianceMonitor';

export default function SteuerVermoegenApp() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(null, 100)
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.AssetPortfolio.list(null, 100)
  });

  const { data: financialItems = [] } = useQuery({
    queryKey: ['financialItems'],
    queryFn: () => base44.entities.FinancialItem.list('-date', 200)
  });

  const totalPropertyValue = buildings.reduce((sum, b) => sum + (b.market_value || 0), 0);
  const totalAssetValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalWealth = totalPropertyValue + totalAssetValue;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Steuer & Vermögen</h1>
              <p className="text-sm text-slate-600">
                Willkommen, {user?.full_name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-600">Gesamtvermögen</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalWealth.toLocaleString('de-DE')} €
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="wealth" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Vermögen
            </TabsTrigger>
            <TabsTrigger value="property" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Immobilien
            </TabsTrigger>
            <TabsTrigger value="tax" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Steuern
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Finanzen
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <FinancialSummaryCards />

            <QuickActionsPanel />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WealthAllocationChart />
              <MonthlyTaxEstimate />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TaxYearOverview />
              <ComplianceMonitor />
              <TaxSavingsTips />
            </div>

            <PropertyTaxOverview />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SmartAlerts />
              <DeadlineTrafficLight />
            </div>

            <TaxCockpit />
          </TabsContent>

          {/* Wealth Tab */}
          <TabsContent value="wealth" className="space-y-6">
            <PortfolioKPICards />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DiversificationScore />
              <RiskAssessment />
              <RebalancingAssistant />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceChart />
              <PerformanceAttribution />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DividendCalendar />
              <CompoundInterestCalculator />
              <WealthSimulator />
            </div>

            <RetirementPlanner />
            <AssetPortfolioTable />
          </TabsContent>

          {/* Property Tab */}
          <TabsContent value="property" className="space-y-6">
            <PropertyTaxOverview />
            <BuildingSummary />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <InvestmentAnalysis />
              <EquityReturnAnalysis />
              <PropertyComparison />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FinancingCalculator />
              <CashflowSimulation />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AfACalculator />
              <RenovationROI />
              <PropertyTaxCalculator />
            </div>

            <InsuranceOverview />
            <BuildingTable />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Objekte nach Typ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { type: 'Wohnimmobilien', count: buildings.filter(b => b.building_type === 'residential').length },
                      { type: 'Gewerbe', count: buildings.filter(b => b.building_type === 'commercial').length },
                      { type: 'Gemischt', count: buildings.filter(b => b.building_type === 'mixed').length }
                    ].map(item => (
                      <div key={item.type} className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm">{item.type}</span>
                        <Badge>{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Gesamtwert nach Standort</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(
                      buildings.reduce((acc, b) => {
                        if (!acc[b.city]) acc[b.city] = 0;
                        acc[b.city] += b.market_value || 0;
                        return acc;
                      }, {})
                    ).slice(0, 5).map(([city, value]) => (
                      <div key={city} className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm">{city}</span>
                        <span className="font-semibold">{value.toLocaleString('de-DE')} €</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tax Tab */}
          <TabsContent value="tax" className="space-y-6">
            <TaxOptimizationRecommendations />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ElsterDirectSubmit />
              <AnlageVQuickGenerator />
              <TaxDeclarationChecklist />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QuarterlyTaxCalculator />
              <LossCarryforwardTracker />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ExpenseScanner />
              <MileageLogger />
              <BusinessTripTracker />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DoubleTaxCalculator />
              <TaxAdvisorInterface />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GoBDArchive />
              <RetentionTracker />
              <AuditPreparation />
            </div>

            <ComprehensiveTaxDashboard />
            <TaxOptimizationPanel />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Steuer-Fristen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { date: '2026-05-31', description: 'Einkommensteuererklärung', days: 141 },
                      { date: '2026-02-10', description: 'Umsatzsteuer-Voranmeldung', days: 31 },
                      { date: '2026-03-15', description: 'Grundsteuer', days: 64 }
                    ].map((deadline, idx) => (
                      <div key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="font-semibold text-sm">{deadline.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-slate-600">{deadline.date}</p>
                          <Badge className="bg-orange-600">in {deadline.days} Tagen</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Steuer-Kategorien</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { category: 'Mieteinnahmen', amount: 48000 },
                      { category: 'Kapitalerträge', amount: 12000 },
                      { category: 'Sonstige Einkünfte', amount: 8000 }
                    ].map(item => (
                      <div key={item.category} className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm">{item.category}</span>
                        <span className="font-semibold">{item.amount.toLocaleString('de-DE')} €</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance" className="space-y-6">
            <FinancialSummaryCards />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <FinAPISyncPanel />
              <AICategorizationEngine />
              <BatchImport />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BudgetTracker />
              <CashflowForecast />
            </div>

            <RecurringBookings />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DocumentUploadManager />
              <BulkDocumentUpload />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DocumentSearchEngine />
              <SmartFilingAssistant />
            </div>

            <TaxDocumentGallery />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transaktionen & Buchungen</CardTitle>
              </CardHeader>
              <CardContent>
                <FinancialItemTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}