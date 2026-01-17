import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ImplementationChecklistPrompt22to27() {
  const checklist = {
    'Prompt #22: Detail Page Templates': {
      items: [
        { task: 'VfDetailPage Component', done: true },
        { task: 'BuildingDetailTemplate', done: true },
        { task: 'UnitDetailTemplate', done: true },
        { task: 'TenantDetailTemplate', done: true },
        { task: 'ContractDetailTemplate', done: true },
        { task: 'Detail Header & Stats CSS', done: true },
        { task: 'Detail Tabs CSS', done: true },
        { task: 'Detail Sidebar CSS', done: true }
      ]
    },
    'Prompt #23: Shared Components': {
      items: [
        { task: 'VfButton', done: true },
        { task: 'VfInput', done: true },
        { task: 'VfSelect', done: true },
        { task: 'VfTextarea', done: true },
        { task: 'VfCheckbox', done: true },
        { task: 'VfRadio', done: true },
        { task: 'VfSwitch', done: true },
        { task: 'VfDatePicker', done: true },
        { task: 'VfProgress', done: true },
        { task: 'VfSkeleton', done: true },
        { task: 'VfAvatar', done: true },
        { task: 'VfBadge', done: true },
        { task: 'VfAlert', done: true },
        { task: 'VfSpinner', done: true },
        { task: 'VfToast', done: true },
        { task: 'VfModal', done: true },
        { task: 'VfCard', done: true },
        { task: 'VfTable', done: true },
        { task: 'VfFormField', done: true },
        { task: 'VfEmptyState', done: true },
        { task: 'VfLoadingState', done: true }
      ]
    },
    'Prompt #24: Entity Schemas': {
      items: [
        { task: 'Lead Entity', done: true },
        { task: 'CalculationHistory Entity', done: true },
        { task: 'QuizResult Entity', done: true },
        { task: 'VPIIndex Entity', done: true },
        { task: 'GeneratedDocument Entity (existing)', done: true },
        { task: 'SubscriptionPlan Entity (existing)', done: true }
      ]
    },
    'Prompt #25: Backend Functions': {
      items: [
        { task: 'captureLead', done: true },
        { task: 'calculateRendite', done: true },
        { task: 'calculateIndexmiete', done: true },
        { task: 'processQuizResult', done: true },
        { task: 'fetchVpiIndex', done: true },
        { task: 'generatePdf', done: true },
        { task: 'sendLetterXpress', done: true },
        { task: 'seedVPIData', done: true },
        { task: 'trackCalculation', done: true },
        { task: 'sendWelcomeEmail', done: true },
        { task: 'sendLeadNurturingEmail', done: true },
        { task: 'updateLeadScore', done: true },
        { task: 'analyzeLeadBehavior', done: true },
        { task: 'convertLeadToUser', done: true },
        { task: 'scheduleLeadNurturing', done: true },
        { task: 'sendCalculationEmail', done: true },
        { task: 'exportCalculationPDF', done: true },
        { task: 'generateCalculatorPDF', done: true },
        { task: 'autoUpdateVPI', done: true },
        { task: 'generateLeadReport', done: true }
      ]
    },
    'Prompt #27.1: Dashboards': {
      items: [
        { task: 'VfDashboard Component', done: true },
        { task: 'VfKpiCard Component', done: true },
        { task: 'VfDashboardWidget Component', done: true },
        { task: 'VfBuildingMini Component', done: true },
        { task: 'VfDueItem Component', done: true },
        { task: 'VfQuickActions Component', done: true },
        { task: 'VermieterDashboard Page', done: true },
        { task: 'MieterDashboard Page', done: true },
        { task: 'AdminDashboardTemplate Page', done: true },
        { task: 'StBDashboard Page', done: true },
        { task: 'DashboardHome (Router)', done: true },
        { task: 'Dashboard CSS Styles', done: true }
      ]
    },
    'Prompt #27.3: Workflows': {
      items: [
        { task: 'VfBKWizard Component', done: true },
        { task: 'MietvertragWizard Component', done: true },
        { task: 'AnlageVWizard Page', done: true },
        { task: 'BKAbrechnungWizard Page', done: true },
        { task: 'Wizard CSS Styles', done: true }
      ]
    },
    'Prompt #27.4: Onboarding': {
      items: [
        { task: 'VfOnboardingWizard Component', done: true },
        { task: 'VfOnboardingOptions Component', done: true },
        { task: 'OnboardingWizardNew Page', done: true },
        { task: 'Onboarding CSS Styles', done: true }
      ]
    },
    'Prompt #27.5: Settings': {
      items: [
        { task: 'VfSettingsLayout Component', done: true },
        { task: 'SettingsProfile Page', done: true },
        { task: 'VermieterProfilSettings Page', done: true },
        { task: 'NotificationManagement Page', done: true },
        { task: 'Settings CSS Styles', done: true }
      ]
    },
    'Prompt #27.6: Error Pages': {
      items: [
        { task: 'VfErrorPage Component', done: true },
        { task: 'VfError404', done: true },
        { task: 'VfError500', done: true },
        { task: 'VfErrorOffline', done: true },
        { task: 'VfErrorMaintenance', done: true },
        { task: 'Error404 Page', done: true },
        { task: 'Error500 Page', done: true },
        { task: 'OfflineError Page', done: true },
        { task: 'MaintenanceMode Page', done: true },
        { task: 'Error CSS Styles', done: true }
      ]
    },
    'Prompt #27.7: Notifications': {
      items: [
        { task: 'VfNotificationCenter Component', done: true },
        { task: 'VfNotification Component', done: true },
        { task: 'VfActivityFeed Component', done: true },
        { task: 'VfActivityItem Component', done: true },
        { task: 'NotificationManagement Page', done: true },
        { task: 'Notifications CSS Styles', done: true }
      ]
    },
    'Additional Pages & Tools': {
      items: [
        { task: 'RenditeRechner', done: true },
        { task: 'IndexmietenRechner', done: true },
        { task: 'AfACalculator', done: true },
        { task: 'CashflowRechner', done: true },
        { task: 'TilgungsRechner', done: true },
        { task: 'KaufpreisRechner', done: true },
        { task: 'WertentwicklungsRechner', done: true },
        { task: 'BKChecker', done: true },
        { task: 'MietvertragGenerator', done: true },
        { task: 'InvestorProfilQuiz', done: true },
        { task: 'SteuerGuideQuiz', done: true },
        { task: 'MarketReportGenerator', done: true },
        { task: 'VermitifyHomepage', done: true },
        { task: 'VermitifyToolsOverview', done: true },
        { task: 'VermitifyPricing', done: true },
        { task: 'VermitifyFeatures', done: true },
        { task: 'VermitifyAboutUs', done: true },
        { task: 'VermitifyContact', done: true },
        { task: 'VermitifyFAQ', done: true },
        { task: 'VermitifyBlog', done: true },
        { task: 'VermitifyTestimonials', done: true },
        { task: 'VermitifyRoadmap', done: true },
        { task: 'VermitifyChangelog', done: true },
        { task: 'VermitifyPartners', done: true },
        { task: 'VermitifyCaseStudies', done: true },
        { task: 'VermitifyComparison', done: true },
        { task: 'VermitifyAGB', done: true },
        { task: 'VermitifyImpressum', done: true },
        { task: 'VermitifyDatenschutz', done: true },
        { task: 'VermitifySitemap', done: true },
        { task: 'VermitifySignup', done: true },
        { task: 'VermitifyLogin', done: true },
        { task: 'VermitifyHelp', done: true },
        { task: 'VermitifyStatusPage', done: true },
        { task: 'ToolsLandingPage', done: true },
        { task: 'FeatureVergleich', done: true },
        { task: 'QuickStartGuide', done: true },
        { task: 'LeadManagement', done: true },
        { task: 'AdminLeadDashboard', done: true },
        { task: 'AdminAnalyticsDashboard', done: true },
        { task: 'AdminUserManagement', done: true },
        { task: 'AdminSubscriptionOverview', done: true },
        { task: 'CalculationHistory', done: true },
        { task: 'DocumentationComplete', done: true }
      ]
    }
  };

  const totalTasks = Object.values(checklist).reduce((sum, section) => sum + section.items.length, 0);
  const completedTasks = Object.values(checklist).reduce(
    (sum, section) => sum + section.items.filter(i => i.done).length, 
    0
  );
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Implementation Checklist: Prompts #22-27</h1>
        <div className="flex items-center gap-4">
          <div className="flex-1 vf-progress vf-progress-lg">
            <div 
              className="vf-progress-bar vf-progress-bar-gradient" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="text-2xl font-bold text-[var(--vf-primary-600)]">
            {completionPercentage}%
          </div>
        </div>
        <p className="text-[var(--theme-text-secondary)] mt-2">
          {completedTasks} von {totalTasks} Tasks abgeschlossen
        </p>
      </div>

      <div className="grid gap-6">
        {Object.entries(checklist).map(([section, data]) => {
          const sectionCompleted = data.items.filter(i => i.done).length;
          const sectionTotal = data.items.length;
          const sectionPercentage = Math.round((sectionCompleted / sectionTotal) * 100);

          return (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{section}</span>
                  <span className={cn(
                    "vf-badge",
                    sectionPercentage === 100 ? "vf-badge-success" : "vf-badge-warning"
                  )}>
                    {sectionCompleted}/{sectionTotal}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-2">
                  {data.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {item.done ? (
                        <CheckCircle className="h-4 w-4 text-[var(--vf-success-500)]" />
                      ) : (
                        <Circle className="h-4 w-4 text-[var(--vf-neutral-300)]" />
                      )}
                      <span className={item.done ? '' : 'text-[var(--theme-text-muted)]'}>
                        {item.task}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}