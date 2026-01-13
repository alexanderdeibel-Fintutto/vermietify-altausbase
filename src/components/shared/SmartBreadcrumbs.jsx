import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, Home } from 'lucide-react';

export default function SmartBreadcrumbs({ 
  items = [],
  maxItems = 3
}) {
  if (items.length === 0) return null;

  let displayItems = items;
  if (items.length > maxItems) {
    displayItems = [items[0], { label: '...', disabled: true }, ...items.slice(-maxItems + 2)];
  }

  return (
    <nav className="flex items-center gap-1 text-sm">
      {displayItems.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
          {item.disabled ? (
            <span className="px-2 text-slate-400">{item.label}</span>
          ) : item.href ? (
            <Link
              to={item.href}
              className="px-2 text-slate-600 hover:text-slate-900 hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="px-2 text-slate-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}