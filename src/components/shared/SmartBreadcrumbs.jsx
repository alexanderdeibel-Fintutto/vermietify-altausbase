import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SmartBreadcrumbs({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-xs sm:text-sm text-slate-600" aria-label="Breadcrumb">
      <Link
        to={createPageUrl('Home')}
        className="flex items-center gap-1 hover:text-slate-900"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-slate-900 truncate"
              title={item.label}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 font-medium truncate" title={item.label}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}