import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useBuildingLimitValidator } from '@/hooks/useBuildingLimitValidator';
import { Building2, Home, TrendingUp } from 'lucide-react';

export default function UsageAnalyticsDashboard() {
  const {
    packageConfig,
    buildings,
    units,
    getBuildingUsagePercentage,
    getUnitUsagePercentage,
    getRemainingBuildings,
    getRemainingUnits
  } = useBuildingLimitValidator();

  if (!packageConfig) return null;

  const buildingUsage = getBuildingUsagePercentage();
  const unitUsage = getUnitUsagePercentage();
  const remainingBuildings = getRemainingBuildings();
  const remainingUnits = getRemainingUnits();

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Objekte */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-600" />
              Objekte
            </CardTitle>
            <Badge variant="outline" className={getStatusColor(buildingUsage)}>
              {buildingUsage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">{buildings.length} von {packageConfig.max_buildings}</span>
              <span className={`font-medium ${getStatusColor(buildingUsage)}`}>
                {remainingBuildings} verbleibend
              </span>
            </div>
            <Progress value={Math.min(buildingUsage, 100)} className="h-2" />
          </div>

          {buildingUsage >= 80 && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              ⚠️ Du erreichst bald dein Limit. Upgrade für mehr Objekte.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wohneinheiten */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="w-5 h-5 text-slate-600" />
              Wohneinheiten
            </CardTitle>
            <Badge variant="outline" className={getStatusColor(unitUsage)}>
              {unitUsage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">{units.length} von {packageConfig.max_units}</span>
              <span className={`font-medium ${getStatusColor(unitUsage)}`}>
                {remainingUnits} verbleibend
              </span>
            </div>
            <Progress value={Math.min(unitUsage, 100)} className="h-2" />
          </div>

          {unitUsage >= 80 && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              ⚠️ Du erreichst bald dein Limit. Upgrade für mehr Wohneinheiten.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}