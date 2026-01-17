import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, FileText } from 'lucide-react';

export default function SearchResults({ results = [] }) {
  const icons = {
    building: Building2,
    tenant: Users,
    contract: FileText
  };

  return (
    <div className="py-2">
      {results.map((result) => {
        const Icon = icons[result.type] || FileText;
        return (
          <Link
            key={`${result.type}-${result.id}`}
            to={result.url}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--theme-surface-hover)] transition-colors"
          >
            <Icon className="h-5 w-5 text-[var(--theme-primary)]" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{result.title}</div>
              {result.subtitle && (
                <div className="text-xs text-[var(--theme-text-muted)] truncate">{result.subtitle}</div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}