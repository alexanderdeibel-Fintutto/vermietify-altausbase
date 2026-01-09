import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
            Building2, 
            Menu,
            X,
            Users,
            Settings
        } from 'lucide-react';
import { cn } from "@/lib/utils";
import NotificationCenter from '@/components/notifications/NotificationCenter';
import SuiteSwitcher from '@/components/suite/SuiteSwitcher';
import TesterTracker from '@/components/testing/TesterTracker';
import SmartProblemReportButton from '@/components/testing/SmartProblemReportButton';
import { Button } from "@/components/ui/button";
import OnboardingRedirect from '@/components/onboarding/OnboardingRedirect';
import AdaptiveNavigation from '@/components/navigation/AdaptiveNavigation';
import FeatureUnlockNotification from '@/components/navigation/FeatureUnlockNotification';
import SubNavigation from '@/components/navigation/SubNavigation';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import BreadcrumbNavigation from '@/components/navigation/BreadcrumbNavigation';
import HamburgerMenu from '@/components/navigation/HamburgerMenu';
import DeepSubNavigation from '@/components/navigation/DeepSubNavigation';
import QuickActions from '@/components/navigation/QuickActions';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { usePackageAccess } from '@/components/hooks/usePackageAccess';

export default function Layout({ children, currentPageName }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { hasModuleAccess, packageConfig } = usePackageAccess();
    
    const { data: navigationState } = useQuery({
        queryKey: ['navigationState'],
        queryFn: async () => {
            const states = await base44.entities.NavigationState.list('-updated_date', 1);
            return states[0];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        cacheTime: 10 * 60 * 1000
    });

    // Filtere Features basierend auf Paket
    let visibleFeatures = navigationState?.visible_features || [];
    if (packageConfig && hasModuleAccess) {
        visibleFeatures = visibleFeatures.filter(feature => {
            // Always show core features
            if (['dashboard', 'account', 'finanzen'].includes(feature)) return true;
            // Check module access for other features
            return hasModuleAccess(feature);
        });
    }
    
    const getCurrentMainSection = () => {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('finanzen') || path.includes('invoice') || path.includes('bank')) return 'finanzen';
        if (path.includes('building') || path.includes('unit') || path.includes('insurance')) return 'immobilien';
        if (path.includes('tenant') || path.includes('contract') || path.includes('operating')) return 'mieter';
        if (path.includes('tax') || path.includes('steuer') || path.includes('elster')) return 'steuer';
        return null;
    };

    const mainSection = getCurrentMainSection();

    return (
            <OnboardingRedirect>
            <TesterTracker>
            <FeatureUnlockNotification />
            <div className="min-h-screen bg-slate-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-slate-800 text-lg tracking-tight">ImmoVerwalter</span>
                    </div>
                    <button 
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                    </div>

                    <div className="p-4">
                    <p className="text-xs text-slate-500 mb-2">Quick Links</p>
                    <div className="space-y-1">
                        <Link to={createPageUrl('Buildings')} onClick={() => setSidebarOpen(false)} className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">Objekte</Link>
                        <Link to={createPageUrl('Tenants')} onClick={() => setSidebarOpen(false)} className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">Mieter</Link>
                        <Link to={createPageUrl('Finanzen')} onClick={() => setSidebarOpen(false)} className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">Finanzen</Link>
                    </div>
                    </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-72">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
                    <div className="flex items-center h-16 px-4 lg:px-8 gap-4">
                        <button 
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg flex-shrink-0"
                        >
                            <Menu className="w-5 h-5 text-slate-600" />
                        </button>
                        <HamburgerMenu currentSection={mainSection} visibleFeatures={visibleFeatures} />
                        <div className="flex-1 min-w-0">
                            <AdaptiveNavigation currentPageName={currentPageName} />
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <QuickActions visibleFeatures={visibleFeatures} />
                            <SuiteSwitcher />
                            <NotificationCenter />
                            <Link to={createPageUrl('MyAccount')}>
                            <Button variant="ghost" size="icon" title="Mein Account">
                            <Users className="w-5 h-5 text-slate-600" />
                            </Button>
                            </Link>
                            <Link to={createPageUrl('UserSettings')}>
                            <Button variant="ghost" size="icon" title="Einstellungen">
                            <Settings className="w-5 h-5 text-slate-600" />
                            </Button>
                            </Link>
                        </div>
                    </div>
                    </header>

                    {/* Breadcrumb Navigation */}
                    <BreadcrumbNavigation />

                    {/* Sub-Navigation */}
                    {mainSection && <SubNavigation mainSection={mainSection} visibleFeatures={visibleFeatures} />}

                    {/* Deep Sub-Navigation (Level 3+) */}
                    <DeepSubNavigation parentSection={mainSection} currentPage={currentPageName} visibleFeatures={visibleFeatures} />

                    {/* Page content */}
                    <main className="p-4 lg:p-8 mb-20 lg:mb-0">
                    {children}
                </main>

                {/* Smart Problem Report Button */}
                <SmartProblemReportButton />

                {/* Mobile Bottom Navigation */}
                <MobileBottomNav visibleFeatures={visibleFeatures} />
                </div>
                </div>
                </TesterTracker>
                </OnboardingRedirect>
                );
            }