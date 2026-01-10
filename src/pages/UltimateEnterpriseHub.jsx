import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import TeamChat from '@/components/collaboration/TeamChat';
import TaskComments from '@/components/collaboration/TaskComments';
import ApprovalWorkflowManager from '@/components/collaboration/ApprovalWorkflowManager';
import CollaborativeDocumentEditor from '@/components/collaboration/CollaborativeDocumentEditor';

import SmartCategorizationEngine from '@/components/automation/SmartCategorizationEngine';
import SmartFormPrefill from '@/components/automation/SmartFormPrefill';
import AutoReceiptRecognition from '@/components/automation/AutoReceiptRecognition';
import DuplicateDetector from '@/components/automation/DuplicateDetector';

import AnnualClosingGenerator from '@/components/reporting/AnnualClosingGenerator';
import TaxAdvisorExportPackage from '@/components/reporting/TaxAdvisorExportPackage';
import PerformanceAttributionAnalysis from '@/components/reporting/PerformanceAttributionAnalysis';

import LegalTextUpdates from '@/components/compliance/LegalTextUpdates';
import RentalLawChecker from '@/components/compliance/RentalLawChecker';
import GDPRDataDeletion from '@/components/compliance/GDPRDataDeletion';
import ContractClauseAnalyzer from '@/components/compliance/ContractClauseAnalyzer';

import WhatIfSimulator from '@/components/simulation/WhatIfSimulator';
import MonteCarloSimulator from '@/components/simulation/MonteCarloSimulator';
import TaxProjectionCalculator from '@/components/simulation/TaxProjectionCalculator';
import ReturnForecast from '@/components/simulation/ReturnForecast';

import MultiUserRoleManager from '@/components/admin/MultiUserRoleManager';
import ActivityAuditLog from '@/components/admin/ActivityAuditLog';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';
import PerformanceMonitoring from '@/components/admin/PerformanceMonitoring';

import DamageReportForm from '@/components/tenant-self-service/DamageReportForm';
import TenantDocumentUpload from '@/components/tenant-self-service/TenantDocumentUpload';
import ViewingScheduler from '@/components/tenant-self-service/ViewingScheduler';
import NeighborhoodForum from '@/components/tenant-self-service/NeighborhoodForum';

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

export default function UltimateEnterpriseHub() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ultimate Enterprise Hub</h1>

      <Tabs defaultValue="collaboration">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="collaboration">Kollaboration</TabsTrigger>
          <TabsTrigger value="automation">Automatisierung</TabsTrigger>
          <TabsTrigger value="reporting">Berichte</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="tenant">Mieter-Portal</TabsTrigger>
          <TabsTrigger value="advanced">Erweitert</TabsTrigger>
        </TabsList>

        <TabsContent value="collaboration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamChat />
            <TaskComments taskId="example" />
            <ApprovalWorkflowManager />
            <CollaborativeDocumentEditor documentId="example" />
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SmartCategorizationEngine />
            <AutoReceiptRecognition />
            <DuplicateDetector />
          </div>
          <SmartFormPrefill formType="invoice" />
        </TabsContent>

        <TabsContent value="reporting" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnnualClosingGenerator />
            <TaxAdvisorExportPackage />
            <QuarterlyReportGenerator />
            <CustomReportDesigner />
          </div>
          <PerformanceAttributionAnalysis />
          <PlanVsActualComparison />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LegalTextUpdates />
            <RentalLawChecker contractId="example" />
            <GDPRDataDeletion />
            <ContractClauseAnalyzer contractId="example" />
          </div>
        </TabsContent>

        <TabsContent value="simulation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WhatIfSimulator />
            <MonteCarloSimulator />
            <TaxProjectionCalculator />
            <ReturnForecast />
          </div>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MultiUserRoleManager />
            <ActivityAuditLog />
            <SystemHealthMonitor />
            <PerformanceMonitoring />
          </div>
        </TabsContent>

        <TabsContent value="tenant" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DamageReportForm />
            <TenantDocumentUpload />
            <ViewingScheduler />
            <NeighborhoodForum />
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <PropertyROIComparison />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VacancyCostCalculator />
            <RegionalMarketAnalysis />
          </div>
          <RealtimeCashflowMonitor />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetAlertManager />
            <CostCenterAccounting />
          </div>
          <ProfitLossForecast />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TenantScoring tenantId="example" />
            <AutomatedReminderFlow />
            <DepositManager />
            <ContractRenewalAssistant />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}