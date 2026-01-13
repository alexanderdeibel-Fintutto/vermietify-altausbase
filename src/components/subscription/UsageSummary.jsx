import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Infinity } from 'lucide-react';

export default function UsageSummary() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: userLimits = [] } = useQuery({
    queryKey: ['userLimits', user?.email],
    queryFn: async () => {
      return await base44.entities.UserLimit.filter({ 
        user_email: user.email 
      });
    },
    enabled: !!user?.email
  });

  const { data: limits = [] } = useQuery({
    queryKey: ['usageLimits'],
    queryFn: () => base44.entities.UsageLimit.list()
  });

  const getLimitInfo = (userLimit) => {
    const limit = limits.find(l => l.id === userLimit.limit_id);
    const isUnlimited = userLimit.limit_value === -1;
    const percentage = isUnlimited ? 0 : (userLimit.current_usage / userLimit.limit_value) * 100;
    const isWarning = percentage >= (limit?.warning_threshold || 80);
    const isCritical = percentage >= 95;

    return { limit, isUnlimited, percentage, isWarning, isCritical };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-light">Nutzungsübersicht</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {userLimits.map(userLimit => {
          const { limit, isUnlimited, percentage, isWarning, isCritical } = getLimitInfo(userLimit);
          
          if (!limit) return null;

          return (
            <div key={userLimit.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{limit.name}</span>
                  {isUnlimited ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <Infinity className="h-3 w-3 mr-1" />
                      Unbegrenzt
                    </Badge>
                  ) : isCritical ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : isWarning ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                {!isUnlimited && (
                  <span className="text-sm text-slate-600">
                    {userLimit.current_usage} / {userLimit.limit_value} {limit.unit}
                  </span>
                )}
              </div>
              {!isUnlimited && (
                <Progress 
                  value={percentage} 
                  className={`h-2 ${isCritical ? 'bg-red-100' : isWarning ? 'bg-yellow-100' : ''}`}
                />
              )}
            </div>
          );
        })}
        
        {userLimits.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            Keine Limits konfiguriert
          </p>
        )}
      </CardContent>
    </Card>
  );
}