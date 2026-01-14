import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const BreadcrumbNavigation = ({ currentPageName }) => {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const buildingId = urlParams.get('id') || urlParams.get('buildingId');
  const unitId = urlParams.get('unitId');
  const contractId = urlParams.get('contractId');

  const { data: building } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: async () => {
      const buildings = await base44.entities.Building.filter({ id: buildingId });
      return buildings[0];
    },
    enabled: !!buildingId
  });

  const { data: unit } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: async () => {
      const units = await base44.entities.Unit.filter({ id: unitId });
      return units[0];
    },
    enabled: !!unitId
  });

  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbs = [];
  
  // Always start with Dashboard
  breadcrumbs.push({ name: 'Dashboard', path: createPageUrl('Dashboard'), isLast: false });
  
  // Add context-aware breadcrumbs
  if (building && (currentPageName === 'BuildingDetail' || currentPageName === 'UnitDetail')) {
    breadcrumbs.push({ 
      name: 'Gebäude', 
      path: createPageUrl('Buildings'), 
      isLast: false 
    });
    breadcrumbs.push({ 
      name: building.name, 
      path: createPageUrl(`BuildingDetail?id=${buildingId}`), 
      isLast: !unit 
    });
  }
  
  if (unit && currentPageName === 'UnitDetail') {
    breadcrumbs.push({ 
      name: unit.unit_number, 
      path: createPageUrl(`UnitDetail?unitId=${unitId}`), 
      isLast: true 
    });
  }

  if (contractId && currentPageName === 'ContractDetail') {
    breadcrumbs.push({ 
      name: 'Verträge', 
      path: createPageUrl('Contracts'), 
      isLast: false 
    });
    breadcrumbs.push({ 
      name: 'Vertragsdetails', 
      path: location.pathname + location.search, 
      isLast: true 
    });
  }

  // Fallback for other pages
  if (breadcrumbs.length === 1) {
    pathnames.forEach((value, index) => {
      const to = `/${pathnames.slice(0, index + 1).join('/')}`;
      const name = value.charAt(0).toUpperCase() + value.slice(1);
      const isLast = index === pathnames.length - 1;
      
      breadcrumbs.push({
        name: isLast ? currentPageName : name,
        path: to,
        isLast: isLast
      });
    });
  }

  return (
    <div className="px-8 py-2 bg-slate-50 border-b border-slate-100">
      <nav className="flex items-center text-sm text-slate-500">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
            {crumb.isLast ? (
              <span className="font-medium text-slate-800">{crumb.name}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-slate-800">{crumb.name}</Link>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
};

export default BreadcrumbNavigation;