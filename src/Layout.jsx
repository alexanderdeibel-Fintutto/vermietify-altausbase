import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Calculator, FileText, Settings, CreditCard, Home as HomeIcon, Users, Bot } from 'lucide-react';
import NotificationBell from './components/tenant-portal/NotificationBell';
import RealtimeChatIndicator from './components/tenant-portal/RealtimeChatIndicator';
import AIBudgetWarningBanner from './components/ai/AIBudgetWarningBanner';

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: 'Home', icon: HomeIcon, path: 'Home' },
    { name: 'Dashboard', icon: Calculator, path: 'Dashboard' },
    { name: 'Abrechnungen', icon: FileText, path: 'OperatingCosts' },
    { name: 'Mieterportal', icon: Users, path: 'TenantPortalManagement' },
    { name: 'Vertragsanalyse', icon: FileText, path: 'ContractAnalysis' },
    { name: 'Preise', icon: CreditCard, path: 'Pricing' },
    { name: 'KI-Settings', icon: Bot, path: 'AISettings' },
    { name: 'KI-Prompts', icon: Bot, path: 'AISystemPromptAdmin' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-900 to-orange-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">NK-Abrechnung</h1>
                <p className="text-xs text-gray-600">by FinTuttO</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentPageName === item.path;
                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-900 font-semibold' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
              <NotificationBell />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <AIBudgetWarningBanner />
        </div>
        {children}
      </main>
      
      {/* Realtime Chat Indicator */}
      <RealtimeChatIndicator />
    </div>
  );
}