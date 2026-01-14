import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, Home } from 'lucide-react';

export default function SmartBreadcrumbs({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-600">
      <Link 
        to={createPageUrl('Dashboard')} 
        className="hover:text-slate-900 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>

      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          {item.href ? (
            <Link
              to={item.href}
              className={`hover:text-slate-900 transition-colors ${
                idx === items.length - 1 ? 'font-medium text-slate-900' : ''
              }`}
            >
              {item.label}
            </Link>
          ) : (
            <span className={idx === items.length - 1 ? 'font-medium text-slate-900' : ''}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}