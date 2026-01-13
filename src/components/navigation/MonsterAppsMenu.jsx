import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Briefcase,
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  Home,
  Building2,
  MessageSquare,
  Lightbulb,
  FileText
} from 'lucide-react';

const MONSTER_APPS = [
  { name: 'Handwerker-Marktplatz', icon: Briefcase, page: 'ContractorMarketplace', color: 'bg-blue-50' },
  { name: 'Mieterhöhungs-Engine', icon: TrendingUp, page: 'RentIncreaseOptimizer', color: 'bg-green-50' },
  { name: 'Mietervetting', icon: Users, page: 'TenantVettingSystem', color: 'bg-purple-50' },
  { name: 'Betriebskosten-Automation', icon: Zap, page: 'OperatingCostAutomationHub', color: 'bg-yellow-50' },
  { name: 'Banking Automation', icon: BarChart3, page: 'BankingAutomationHub', color: 'bg-indigo-50' },
  { name: 'Property Valuation', icon: Home, page: 'PropertyValuationEngine', color: 'bg-pink-50' },
  { name: 'White-Label SaaS', icon: Building2, page: 'WhiteLabelSaaS', color: 'bg-orange-50' },
  { name: 'AI Tenant Support', icon: MessageSquare, page: 'TenantAISupport', color: 'bg-cyan-50' },
  { name: 'Portfolio Optimizer', icon: Lightbulb, page: 'PortfolioOptimizer', color: 'bg-red-50' },
  { name: 'Elster Automation', icon: FileText, page: 'ElsterAutomationHub', color: 'bg-slate-50' }
];

export default function MonsterAppsMenu() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-600 px-3 py-2">🚀 MONSTER APPS</p>
      {MONSTER_APPS.map(app => {
        const Icon = app.icon;
        return (
          <Link
            key={app.page}
            to={createPageUrl(app.page)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-200 ${app.color}`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{app.name}</span>
          </Link>
        );
      })}
    </div>
  );
}