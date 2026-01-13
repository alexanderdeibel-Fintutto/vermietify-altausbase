import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Home, 
  Building2, 
  Users, 
  FileText, 
  Calculator, 
  TrendingUp,
  Settings,
  Tag,
  ChevronDown
} from 'lucide-react';
import { cn } from "@/lib/utils";
import BuildingSelector from '@/components/sidebar/BuildingSelector';

const menuItems = [
  { name: 'Dashboard', icon: Home, page: 'Dashboard' },
  { name: 'Immobilien', icon: Building2, page: 'Buildings' },
  { name: 'Mieter', icon: Users, page: 'Tenants' },
  { name: 'Finanzen', icon: FileText, page: 'FinanceDashboard' },
  { name: 'Steuern', icon: Calculator, page: 'TaxDashboard' },
  { name: 'Vermögen', icon: TrendingUp, page: 'PortfolioDashboard', badge: 'NEU' },
];

const adminMenuItems = [
  { name: 'Produkte', page: 'AdminPricingProducts' },
  { name: 'Feature-Gruppen', page: 'AdminPricingFeatureGroups' },
  { name: 'Features', page: 'AdminPricingFeatures' },
  { name: 'Tarife', page: 'AdminPricingTiers' },
  { name: 'Bundles', page: 'AdminPricingBundles' },
  { name: 'Limits', page: 'AdminLimitsConfig' },
  { name: 'User-Subscriptions', page: 'AdminUserSubscriptions' },
  { name: 'Pricing-Matrix', page: 'AdminPricingMatrix' },
];

export default function MainSidebar() {
  const currentPath = window.location.pathname;
  const [adminOpen, setAdminOpen] = React.useState(false);

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Gebäude-Auswahl */}
      <div className="p-4 border-b border-slate-700">
        <BuildingSelector />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPath.includes(item.page);
          
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive 
                  ? "bg-emerald-600 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-light">{item.name}</span>
              {item.badge && (
                <span className="ml-auto text-xs bg-yellow-500 text-slate-900 px-2 py-0.5 rounded-full font-medium">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Admin Section */}
        <div className="pt-4 mt-4 border-t border-slate-700">
          <button
            onClick={() => setAdminOpen(!adminOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Tag className="w-5 h-5" />
            <span className="font-light">Pricing-Konfigurator</span>
            <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", adminOpen && "rotate-180")} />
          </button>
          
          {adminOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {adminMenuItems.map(item => {
                const isActive = currentPath.includes(item.page);
                
                return (
                  <Link
                    key={item.page}
                    to={item.disabled ? '#' : createPageUrl(item.page)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors",
                      item.disabled && "opacity-40 cursor-not-allowed",
                      !item.disabled && isActive && "bg-slate-700 text-white",
                      !item.disabled && !isActive && "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                    onClick={e => item.disabled && e.preventDefault()}
                  >
                    {item.name}
                    {item.disabled && <span className="ml-auto text-xs">Phase 2</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <Link
          to={createPageUrl('UserSettings')}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="font-light">Einstellungen</span>
        </Link>
      </div>
    </aside>
  );
}