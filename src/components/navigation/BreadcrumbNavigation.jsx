import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight } from 'lucide-react';

const BreadcrumbNavigation = ({ currentPageName }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbs = pathnames.map((value, index) => {
    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
    const name = value.charAt(0).toUpperCase() + value.slice(1);
    const isLast = index === pathnames.length - 1;
    
    return {
      name: isLast ? currentPageName : name,
      path: to,
      isLast: isLast
    };
  });

  return (
    <div className="px-8 py-2 bg-slate-50 border-b border-slate-100">
      <nav className="flex items-center text-sm text-slate-500">
        <Link to={createPageUrl('Dashboard')} className="hover:text-slate-800">Dashboard</Link>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="w-4 h-4 mx-1" />
            {
              crumb.isLast ? (
                <span className="font-medium text-slate-800">{crumb.name}</span>
              ) : (
                <Link to={crumb.path} className="hover:text-slate-800">{crumb.name}</Link>
              )
            }
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
};

export default BreadcrumbNavigation;