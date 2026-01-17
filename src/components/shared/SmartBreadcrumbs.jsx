import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SmartBreadcrumbs({ items = [] }) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-4">
      <Link to={createPageUrl('Dashboard')} className="text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)]">
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-[var(--theme-text-muted)]" />
          {item.href ? (
            <Link 
              to={createPageUrl(item.href)}
              className="text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--theme-text-primary)] font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}