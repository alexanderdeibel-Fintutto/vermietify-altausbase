import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Home, Building2, FileText, Users, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, page: 'Home' },
  { id: 'buildings', label: 'Gebäude', icon: Building2, page: 'Buildings' },
  { id: 'docs', label: 'Dokumente', icon: FileText, page: 'DocumentManagement' },
  { id: 'tenants', label: 'Mieter', icon: Users, page: 'Tenants' },
  { id: 'settings', label: 'Mehr', icon: Settings, page: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
      <div className="grid grid-cols-5 h-16">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname.includes(item.page);
          
          return (
            <Link
              key={item.id}
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}