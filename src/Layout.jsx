import React, { useState, lazy, Suspense, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { useActivityTracker } from '@/components/testing/ActivityTracker';
import { 
                                            Building2, 
                                            Menu,
                                            X,
                                            Users,
                                            Settings,
                                            Zap
                                        } from 'lucide-react';
import { cn } from "@/lib/utils";
import NotificationCenter from '@/components/documents/DocumentNotificationCenter';
import SuiteSwitcher from '@/components/suite/SuiteSwitcher';
import MandantSwitcher from '@/components/mandant/MandantSwitcher';
import { Button } from "@/components/ui/button";
import GlobalSearchBar from '@/components/search/GlobalSearchBar';
import OnboardingRedirect from '@/components/onboarding/OnboardingRedirect';
import HorizontalMainNavigation from '@/components/navigation/HorizontalMainNavigation';
import DynamicSubNavigation from '@/components/navigation/DynamicSubNavigation';
import BreadcrumbNavigation from '@/components/navigation/BreadcrumbNavigation';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import DeepSubNavigation from '@/components/navigation/DeepSubNavigation';
import IntelligentOnboardingWizardButton from '@/components/onboarding/IntelligentOnboardingWizardButton';
import SmartActionButton from '@/components/actions/SmartActionButton';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { usePackageAccess } from '@/components/hooks/usePackageAccess';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import DocumentInboxNavItem from '@/components/navigation/DocumentInboxNavItem';
import MainCategoryTabs from '@/components/navigation/MainCategoryTabs';
import CategorySubNavigation from '@/components/navigation/CategorySubNavigation';
import PWAInstallPrompt from '@/components/mobile/PWAInstallPrompt';
import MainSidebar from '@/components/sidebar/MainSidebar';
import { useSelectedBuilding } from '@/components/hooks/useSelectedBuilding';
import ProgressIndicator from '@/components/onboarding/ProgressIndicator';
import OfflineIndicator from '@/components/shared/OfflineIndicator';
import SubscriptionInitializer from '@/components/subscription/SubscriptionInitializer';
import KeyboardShortcutsHandler from '@/components/shortcuts/KeyboardShortcutsHandler';
import KeyboardShortcutsHelp from '@/components/shortcuts/KeyboardShortcutsHelp';
import ThemeToggle from '@/components/theme/ThemeToggle';
import ThemeSwitcher from '@/components/theme/ThemeSwitcher';
import VermitifyLogo from '@/components/branding/VermitifyLogo';
import OfflineModeInitializer from '@/components/offline/OfflineModeInitializer';
import { FloatingFeedbackButton } from '@/components/feedback/UserFeedbackCollector';
import ErrorBoundaryWithLogging from '@/components/errors/ErrorBoundaryWithLogging';

// Lazy load heavy components
const TesterTracker = lazy(() => import('@/components/testing/TesterTracker'));
const SmartProblemReportButton = lazy(() => import('@/components/testing/SmartProblemReportButton'));
const FeatureUnlockNotification = lazy(() => import('@/components/navigation/FeatureUnlockNotification'));
const AIChatWidget = lazy(() => import('@/components/ai/AIChatWidget'));

// Lazy load admin pages (loaded only when needed)
const AdminAIAnalytics = lazy(() => import('@/pages/AdminAIAnalytics'));
const AdminTesterAnalytics = lazy(() => import('@/pages/AdminTesterAnalytics'));
const TesterManagement = lazy(() => import('@/pages/TesterManagement'));

const LoadingFallback = () => null;

// Default navigation features als Fallback
const DEFAULT_NAVIGATION_FEATURES = [
    'dashboard', 'buildings', 'units', 'tenants', 'contracts', 'invoices', 
    'bank_accounts', 'documents', 'tasks', 'reports', 'settings'
];

export default function Layout({ children, currentPageName }) {

                  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
                  const [activeCategory, setActiveCategory] = useState('real_estate');
                  const { hasModuleAccess, packageConfig } = usePackageAccess();
                  useActivityTracker();

                  // Apply saved theme on mount
                  useEffect(() => {
                    const savedTheme = localStorage.getItem('vf-theme') || 'vermieter';
                    const savedDark = localStorage.getItem('vf-dark') === 'true';
                    if (savedTheme !== 'vermieter') {
                      document.body.classList.add(`theme-${savedTheme}`);
                    }
                    if (savedDark && savedTheme !== 'invest') {
                      document.body.classList.add('dark');
                    }
                  }, []);

          // Get dynamic app name from package
          const getAppName = () => {
            if (packageConfig?.name) {
              return `FinX${packageConfig.name.replace('Package', '')}`;
            }
            return 'FinX';
          };

          const { data: navigationState } = useQuery({
              queryKey: ['navigationState'],
              queryFn: async () => {
                  const states = await base44.entities.NavigationState.list('-updated_date', 1);
                  return states[0] || null;
              },
              staleTime: 5 * 60 * 1000,
              cacheTime: 10 * 60 * 1000
          });

          let visibleFeatures = navigationState?.visible_features || DEFAULT_NAVIGATION_FEATURES;
    if (packageConfig && hasModuleAccess) {
        visibleFeatures = visibleFeatures.filter(feature => {
            if (['dashboard', 'account', 'finanzen'].includes(feature)) return true;
            return hasModuleAccess(feature);
        });
    }
    
    const getCurrentMainSection = () => {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('documentinbox')) return 'dokumenteingang';
        if (path.includes('finanzen') || path.includes('invoice') || path.includes('bank')) return 'finanzen';
        if (path.includes('building') || path.includes('unit') || path.includes('insurance')) return 'immobilien';
        if (path.includes('tenant') || path.includes('contract') || path.includes('operating')) return 'mieter';
        if (path.includes('tax') || path.includes('steuer') || path.includes('elster')) return 'steuer';
        return null;
    };

    const mainSection = getCurrentMainSection();
    const { selectedBuilding } = useSelectedBuilding();

    // Fetch selected building for theme color
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list(),
    });
    const currentBuilding = buildings.find(b => b.id === selectedBuilding);
    const themeColor = currentBuilding?.theme_color || '#1e293b';

    return (
                                            <ErrorBoundaryWithLogging componentName="Layout">
                                            <ThemeProvider>
                                            <SubscriptionInitializer>
                                            <OnboardingRedirect>
                                            <KeyboardShortcutsHandler />
                                            <KeyboardShortcutsHelp />
                                            <Suspense fallback={null}>
                                              <TesterTracker>
                                                <Suspense fallback={null}>
                                                   <FeatureUnlockNotification />
                                                 </Suspense>
                                 <div className="min-h-screen flex">
                                   {/* Sidebar */}
                                   <MainSidebar />

                                   {/* Main Content Area */}
                                   <div className="flex-1 flex flex-col vf-main-with-sidebar">
                 {/* Top Header Bar */}
                 <header className="vf-navbar">
                    <div className="vf-navbar-left">
                        {/* Global Search */}
                        <div className="vf-navbar-search hidden lg:block">
                            <GlobalSearchBar compact />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="vf-navbar-right">
                        <ThemeSwitcher />
                        <ThemeToggle />
                        <MandantSwitcher />
                        <NotificationCenter />
                        <SuiteSwitcher />
                        <Link to={createPageUrl('MyAccount')}>
                            <button className="vf-navbar-icon-btn" title="Mein Account">
                                <Users className="w-5 h-5" />
                            </button>
                        </Link>
                        <Link to={createPageUrl('UserSettings')}>
                            <button className="vf-navbar-icon-btn" title="Einstellungen">
                                <Settings className="w-5 h-5" />
                            </button>
                        </Link>
                    </div>
                 </header>

                {/* Category Sub-Navigation */}
                <CategorySubNavigation activeCategory={activeCategory} />

                {/* Sub-Navigation */}
                {mainSection && <DynamicSubNavigation mainSection={mainSection} visibleFeatures={visibleFeatures} />}

                {/* Breadcrumbs */}
                <BreadcrumbNavigation currentPageName={currentPageName} />

                {/* Deep Sub-Navigation */}
                <DeepSubNavigation parentSection={mainSection} currentPage={currentPageName} visibleFeatures={visibleFeatures} />

                {/* Main Content - Full Width */}
                <main className="p-6 lg:p-8 mb-20 lg:mb-0 max-w-[1600px] mx-auto mt-16">
                    {children}
                </main>

                {/* Smart Problem Report Button */}
                <Suspense fallback={null}>
                  <SmartProblemReportButton />
                </Suspense>

                {/* Intelligent Onboarding Wizard Button */}
                <IntelligentOnboardingWizardButton />

                {/* Smart Action Button */}
                <SmartActionButton />

                {/* PWA Install Prompt */}
                <PWAInstallPrompt />

                {/* Offline Indicator */}
                                <OfflineIndicator />

                                {/* Offline Mode Support */}
                                                <OfflineModeInitializer />

                                {/* Floating Feedback Button */}
                                <FloatingFeedbackButton />

                                {/* AI Chat Widget */}
                                <Suspense fallback={<LoadingFallback />}>
                                  <AIChatWidget />
                                </Suspense>

                                {/* Mobile Bottom Navigation */}
                <MobileBottomNav visibleFeatures={visibleFeatures} />
                    </div>
                  </div>
                      </TesterTracker>
                      </Suspense>
                      </OnboardingRedirect>
                      </SubscriptionInitializer>
                      </ThemeProvider>
                      </ErrorBoundaryWithLogging>
                      );
                }