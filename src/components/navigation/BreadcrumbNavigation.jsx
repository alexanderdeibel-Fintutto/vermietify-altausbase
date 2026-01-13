import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight } from 'lucide-react';

const BreadcrumbNavigation = ({ crumbs = [] }) => {
  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center text-sm text-slate-500 mb-4">
      {crumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
          {crumb.link ? (
            <Link to={crumb.link} className="hover:text-slate-700">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-700">{crumb.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNavigation;