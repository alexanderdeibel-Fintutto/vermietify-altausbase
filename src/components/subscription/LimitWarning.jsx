import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LimitWarning() {
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

  const warningLimits = userLimits.filter(ul => {
    const limit = limits.find(l => l.id === ul.limit_id);
    if (!limit || ul.limit_value === -1) return false;
    
    const percentage = (ul.current_usage / ul.limit_value) * 100;
    return percentage >= (limit.warning_threshold || 80);
  });

  if (warningLimits.length === 0) {
    return null;
  }

  const criticalLimit = warningLimits[0];
  const limit = limits.find(l => l.id === criticalLimit.limit_id);
  const percentage = (criticalLimit.current_usage / criticalLimit.limit_value) * 100;
  const isCritical = percentage >= 95;

  return (
    <Alert className={isCritical ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
      <AlertTriangle className={`h-4 w-4 ${isCritical ? 'text-red-600' : 'text-yellow-600'}`} />
      <AlertDescription className="flex items-center justify-between">
        <span className={`text-sm ${isCritical ? 'text-red-900' : 'text-yellow-900'}`}>
          <strong>{limit?.name}:</strong> {criticalLimit.current_usage} von {criticalLimit.limit_value} {limit?.unit || 'Einheiten'} genutzt ({percentage.toFixed(0)}%)
        </span>
        <Link to={createPageUrl('MySubscription')}>
          <Button size="sm" variant="outline" className="ml-4">
            Upgraden
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}