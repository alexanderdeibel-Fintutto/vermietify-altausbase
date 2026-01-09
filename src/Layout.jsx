import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
                  Building2, 
                  Menu,
                  X,
                  Users,
                  Settings,
                  Plus
              } from 'lucide-react';
import { cn } from "@/lib/utils";
import NotificationCenter from '@/components/notifications/NotificationCenter';
import SuiteSwitcher from '@/components/suite/SuiteSwitcher';
import TesterTracker from '@/components/testing/TesterTracker';
import SmartProblemReportButton from '@/components/testing/SmartProblemReportButton';
import { Button } from "@/components/ui/button";
import OnboardingRedirect from '@/components/onboarding/OnboardingRedirect';
import HorizontalMainNavigation from '@/components/navigation/HorizontalMainNavigation';
import FeatureUnlockNotification from '@/components/navigation/FeatureUnlockNotification';
import SubNavigation from '@/components/navigation/SubNavigation';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import DeepSubNavigation from '@/components/navigation/DeepSubNavigation';
import QuickActions from '@/components/navigation/QuickActions';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { usePackageAccess } from '@/components/hooks/usePackageAccess';

export default function Layout({ children, currentPageName }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { hasModuleAccess, packageConfig } = usePackageAccess();
    
    const { data: navigationState } = useQuery({
        queryKey: ['navigationState'],
        queryFn: async () => {
            const states = await base44.entities.NavigationState.list('-updated_date', 1);
            return states[0];
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
                {/* Top Header Bar */}
                <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
                    <div className="flex items-center justify-between h-16 px-8">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-extralight text-slate-700 text-lg tracking-wide">ImmoVerwalter</span>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" className="gap-2 font-extralight">
                                <Plus className="w-4 h-4" />
                                Neu
                            </Button>
                            <NotificationCenter />
                            <SuiteSwitcher />
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

                    {/* Horizontal Main Navigation - Desktop */}
                    <div className="hidden lg:block">
                        <HorizontalMainNavigation />
                    </div>
                    
                    {/* Mobile Main Navigation Dropdown */}
                    <div className="lg:hidden border-t border-slate-100">
                        <HorizontalMainNavigation />
                    </div>
                </header>

                {/* Sub-Navigation */}
                {mainSection && <SubNavigation mainSection={mainSection} visibleFeatures={visibleFeatures} />}

                {/* Deep Sub-Navigation */}
                <DeepSubNavigation parentSection={mainSection} currentPage={currentPageName} visibleFeatures={visibleFeatures} />

                {/* Main Content - Full Width */}
                <main className="p-8 mb-20 lg:mb-0 max-w-[1600px] mx-auto">
                    {children}
                </main>

                {/* Smart Problem Report Button */}
                <SmartProblemReportButton />

                {/* Mobile Bottom Navigation */}
                <MobileBottomNav visibleFeatures={visibleFeatures} />
            </div>
            </TesterTracker>
            </OnboardingRedirect>
        );
    }