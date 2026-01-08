import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LimitWarningBanner() {
  const { data: packageConfig } = useQuery({
    queryKey: ['user-package'],
    queryFn: () => base44.entities.UserPackageConfiguration.filter({ 
      user_id: base44.auth.me().then(u => u.id)
    }).then(r => r[0])
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-count'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units-count'],
    queryFn: () => base44.entities.Unit.list()
  });

  if (!packageConfig) return null;

  const buildingUsage = buildings.length;
  const unitUsage = units.length;
  const buildingLimit = packageConfig.max_buildings;
  const unitLimit = packageConfig.max_units;

  const buildingPercentage = (buildingUsage / buildingLimit) * 100;
  const unitPercentage = (unitUsage / unitLimit) * 100;

  const warnings = [];
  
  if (buildingPercentage >= 80) {
    warnings.push({
      type: 'buildings',
      message: `${buildingUsage}/${buildingLimit} Objekte genutzt`,
      percentage: buildingPercentage
    });
  }

  if (unitPercentage >= 80) {
    warnings.push({
      type: 'units',
      message: `${unitUsage}/${unitLimit} Wohneinheiten genutzt`,
      percentage: unitPercentage
    });
  }

  if (warnings.length === 0) return null;

  return (
    <div className="space-y-3">
      {warnings.map(warning => (
        <Card key={warning.type} className="border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900">{warning.message}</p>
                <div className="w-full bg-yellow-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-yellow-600 h-1.5 rounded-full" 
                    style={{ width: `${Math.min(warning.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <Link to={createPageUrl('MyAccount')}>
              <Button size="sm" variant="outline" className="whitespace-nowrap">
                Upgrade
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}