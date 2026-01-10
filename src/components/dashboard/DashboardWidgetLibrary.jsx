// Import all available widgets
import QuickStatsWidget from './widgets/QuickStatsWidget';
import BudgetOverviewWidget from './widgets/BudgetOverviewWidget';
import FinancialForecastWidget from './widgets/FinancialForecastWidget';
import OpenTasksWidget from './widgets/OpenTasksWidget';
import RecentActivitiesWidget from './widgets/RecentActivitiesWidget';
import CriticalNotificationsWidget from './widgets/CriticalNotificationsWidget';
import DocumentAnalysisWidget from './widgets/DocumentAnalysisWidget';
import OnboardingsWidget from './widgets/OnboardingsWidget';
import BuildingsWidget from './widgets/BuildingsWidget';
import TenantsWidget from './widgets/TenantsWidget';
import ContractsWidget from './widgets/ContractsWidget';
import DocumentsWidget from './widgets/DocumentsWidget';
import RevenueWidget from './widgets/RevenueWidget';
import OccupancyWidget from './widgets/OccupancyWidget';
import UpcomingTasksWidget from './widgets/UpcomingTasksWidget';

export const WIDGET_CATEGORIES = {
  overview: {
    label: 'Übersicht',
    widgets: ['quick-stats', 'revenue', 'occupancy']
  },
  financial: {
    label: 'Finanzen',
    widgets: ['budget', 'forecast', 'revenue']
  },
  property: {
    label: 'Immobilien',
    widgets: ['buildings', 'units', 'occupancy']
  },
  tenants: {
    label: 'Mieter',
    widgets: ['tenants', 'contracts', 'onboardings']
  },
  operations: {
    label: 'Verwaltung',
    widgets: ['tasks', 'upcoming-tasks', 'notifications']
  },
  documents: {
    label: 'Dokumente',
    widgets: ['documents', 'document-analysis']
  },
  activity: {
    label: 'Aktivität',
    widgets: ['activities', 'notifications']
  }
};

export const AVAILABLE_WIDGETS = [
  {
    id: 'quick-stats',
    component: 'QuickStatsWidget',
    name: 'Schnellübersicht',
    description: 'Wichtige Kennzahlen auf einen Blick',
    category: 'overview',
    defaultSize: 'full',
    Component: QuickStatsWidget
  },
  {
    id: 'budget',
    component: 'BudgetOverviewWidget',
    name: 'Budget-Übersicht',
    description: 'Budgetplanung und -auslastung',
    category: 'financial',
    defaultSize: 'half',
    Component: BudgetOverviewWidget
  },
  {
    id: 'forecast',
    component: 'FinancialForecastWidget',
    name: 'Finanzprognose',
    description: 'Umsatz- und Ausgabenprognose',
    category: 'financial',
    defaultSize: 'half',
    Component: FinancialForecastWidget
  },
  {
    id: 'revenue',
    component: 'RevenueWidget',
    name: 'Einnahmen',
    description: 'Aktuelle Mieteinnahmen',
    category: 'financial',
    defaultSize: 'third',
    Component: RevenueWidget
  },
  {
    id: 'buildings',
    component: 'BuildingsWidget',
    name: 'Gebäude',
    description: 'Gebäudeübersicht',
    category: 'property',
    defaultSize: 'half',
    Component: BuildingsWidget
  },
  {
    id: 'occupancy',
    component: 'OccupancyWidget',
    name: 'Belegung',
    description: 'Vermietungsstand',
    category: 'property',
    defaultSize: 'third',
    Component: OccupancyWidget
  },
  {
    id: 'tenants',
    component: 'TenantsWidget',
    name: 'Mieter',
    description: 'Mieterübersicht',
    category: 'tenants',
    defaultSize: 'half',
    Component: TenantsWidget
  },
  {
    id: 'contracts',
    component: 'ContractsWidget',
    name: 'Verträge',
    description: 'Aktive Mietverträge',
    category: 'tenants',
    defaultSize: 'half',
    Component: ContractsWidget
  },
  {
    id: 'onboardings',
    component: 'OnboardingsWidget',
    name: 'Onboardings',
    description: 'Aktive Mieter-Onboardings',
    category: 'tenants',
    defaultSize: 'half',
    Component: OnboardingsWidget
  },
  {
    id: 'tasks',
    component: 'OpenTasksWidget',
    name: 'Offene Aufgaben',
    description: 'Pending Tasks und Analysen',
    category: 'operations',
    defaultSize: 'half',
    Component: OpenTasksWidget
  },
  {
    id: 'upcoming-tasks',
    component: 'UpcomingTasksWidget',
    name: 'Anstehende Aufgaben',
    description: 'Termine und Deadlines',
    category: 'operations',
    defaultSize: 'half',
    Component: UpcomingTasksWidget
  },
  {
    id: 'notifications',
    component: 'CriticalNotificationsWidget',
    name: 'Benachrichtigungen',
    description: 'Wichtige Meldungen',
    category: 'operations',
    defaultSize: 'half',
    Component: CriticalNotificationsWidget
  },
  {
    id: 'documents',
    component: 'DocumentsWidget',
    name: 'Dokumente',
    description: 'Letzte Dokumente',
    category: 'documents',
    defaultSize: 'half',
    Component: DocumentsWidget
  },
  {
    id: 'document-analysis',
    component: 'DocumentAnalysisWidget',
    name: 'Dokumentenanalyse',
    description: 'KI-Dokumentenverarbeitung',
    category: 'documents',
    defaultSize: 'half',
    Component: DocumentAnalysisWidget
  },
  {
    id: 'activities',
    component: 'RecentActivitiesWidget',
    name: 'Aktivitäten',
    description: 'Letzte Aktivitäten',
    category: 'activity',
    defaultSize: 'half',
    Component: RecentActivitiesWidget
  }
];

export const WIDGET_COMPONENTS = AVAILABLE_WIDGETS.reduce((acc, widget) => {
  acc[widget.component] = widget.Component;
  return acc;
}, {});

export const getWidgetsByCategory = (category) => {
  return AVAILABLE_WIDGETS.filter(w => w.category === category);
};

export const getWidgetById = (id) => {
  return AVAILABLE_WIDGETS.find(w => w.id === id);
};

// Filter widgets based on user access
export const getAccessibleWidgets = (hasModuleAccess) => {
  if (!hasModuleAccess) return AVAILABLE_WIDGETS;
  
  return AVAILABLE_WIDGETS.filter(widget => {
    // Map widgets to required modules
    const moduleMap = {
      'buildings': 'immobilien',
      'occupancy': 'immobilien',
      'tenants': 'mieter',
      'contracts': 'mieter',
      'onboardings': 'mieter',
      'revenue': 'finanzen',
      'budget': 'finanzen',
      'forecast': 'finanzen',
      'documents': 'dokumenteingang',
      'document-analysis': 'dokumenteingang'
    };
    
    const requiredModule = moduleMap[widget.id];
    if (!requiredModule) return true; // No restriction
    
    return hasModuleAccess(requiredModule);
  });
};