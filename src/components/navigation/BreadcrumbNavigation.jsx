import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, Home } from 'lucide-react';

export default function BreadcrumbNavigation({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-600 mb-4">
      <Link to={createPageUrl('Dashboard')} className="flex items-center gap-1 hover:text-slate-900 transition">
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          {item.href ? (
            <Link to={item.href} className="hover:text-slate-900 transition">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}