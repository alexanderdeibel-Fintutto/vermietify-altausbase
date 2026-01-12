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
  Settings 
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

export default function MainSidebar() {
  const currentPath = window.location.pathname;

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Gebäude-Auswahl */}
      <div className="p-4 border-b border-slate-700">
        <BuildingSelector />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
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