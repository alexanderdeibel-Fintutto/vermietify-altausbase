import React, { useState, lazy, Suspense } from 'react';
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
import { Button } from "@/components/ui/button";
import GlobalSearchBar from '@/components/search/GlobalSearchBar';
import OnboardingRedirect from '@/components/onboarding/OnboardingRedirect';
import HorizontalMainNavigation from '@/components/navigation/HorizontalMainNavigation';
import DynamicSubNavigation from '@/components/navigation/DynamicSubNavigation';
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

// Lazy load heavy components
const TesterTracker = lazy(() => import('@/components/testing/TesterTracker'));
const SmartProblemReportButton = lazy(() => import('@/components/testing/SmartProblemReportButton'));
const FeatureUnlockNotification = lazy(() => import('@/components/navigation/FeatureUnlockNotification'));

// Lazy load admin pages (loaded only when needed)
const AdminAIAnalytics = lazy(() => import('@/pages/AdminAIAnalytics'));
const AdminTesterAnalytics = lazy(() => import('@/pages/AdminTesterAnalytics'));
const TesterManagement = lazy(() => import('@/pages/TesterManagement'));

const LoadingFallback = () => null;

export default function Layout({ children, currentPageName }) {

          const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
          const [activeCategory, setActiveCategory] = useState('real_estate');
          const { hasModuleAccess, packageConfig } = usePackageAccess();
          useActivityTracker(); // Track user activity for testers

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

    let visibleFeatures = navigationState?.visible_features || [];
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
                            <ThemeProvider>
                            <OnboardingRedirect>
                            <Suspense fallback={null}>
                              <TesterTracker>
                                <Suspense fallback={null}>
                                   <FeatureUnlockNotification />
                                 </Suspense>
                                 <div className="min-h-screen flex" style={{ backgroundColor: `${themeColor}04` }}>
                                   {/* Sidebar */}
                                   <MainSidebar />

                                   {/* Main Content Area */}
                                   <div className="flex-1 flex flex-col">
                 {/* Top Header Bar */}
                <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
                    <div className="flex items-center justify-between h-16 px-8">
                        {/* Logo */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                                                <Building2 className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="font-light text-slate-800 text-base tracking-wide">{getAppName()}</span>
                                        </div>

                                        {/* Global Search */}
                                        <div className="hidden lg:block flex-1 max-w-2xl mx-8">
                                            <GlobalSearchBar compact />
                                        </div>

                                        {/* Right Actions */}
                                        <div className="flex items-center gap-3">
                                            <NotificationCenter />
                                            <SuiteSwitcher />
                                            <Link to={createPageUrl('MyAccount')}>
                                                <Button variant="ghost" size="icon" title="Mein Account" className="text-slate-400 hover:text-slate-700">
                                                    <Users className="w-5 h-5" />
                                                </Button>
                                            </Link>
                                            <Link to={createPageUrl('UserSettings')}>
                                                <Button variant="ghost" size="icon" title="Einstellungen" className="text-slate-400 hover:text-slate-700">
                                                    <Settings className="w-5 h-5" />
                                                </Button>
                                            </Link>
                                        </div>
                            </div>


                </header>

                {/* Category Sub-Navigation */}
                <CategorySubNavigation activeCategory={activeCategory} />

                {/* Sub-Navigation */}
                {mainSection && <DynamicSubNavigation mainSection={mainSection} visibleFeatures={visibleFeatures} />}

                {/* Deep Sub-Navigation */}
                <DeepSubNavigation parentSection={mainSection} currentPage={currentPageName} visibleFeatures={visibleFeatures} />

                {/* Main Content - Full Width */}
                <main className="p-6 lg:p-8 mb-20 lg:mb-0 max-w-[1600px] mx-auto">
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

                {/* Mobile Bottom Navigation */}
                <MobileBottomNav visibleFeatures={visibleFeatures} />
                    </div>
                  </div>
                      </TesterTracker>
                    </Suspense>
                </OnboardingRedirect>
                </ThemeProvider>
                );
                }