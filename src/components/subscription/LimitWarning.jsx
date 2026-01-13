import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function LimitWarning() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: userLimits = [] } = useQuery({
    queryKey: ['userLimits', user?.email],
    queryFn: () => base44.entities.UserLimit.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const { data: limits = [] } = useQuery({
    queryKey: ['usageLimits'],
    queryFn: () => base44.entities.UsageLimit.list()
  });

  const warningLimits = userLimits.filter(ul => {
    if (ul.limit_value === -1) return false;
    const percentage = (ul.current_usage / ul.limit_value) * 100;
    const limit = limits.find(l => l.id === ul.limit_id);
    return percentage >= (limit?.warning_threshold || 80);
  });

  if (warningLimits.length === 0) return null;

  return (
    <div className="space-y-3">
      {warningLimits.map(ul => {
        const limit = limits.find(l => l.id === ul.limit_id);
        if (!limit) return null;

        const percentage = Math.min((ul.current_usage / ul.limit_value) * 100, 100);
        const isExceeded = ul.current_usage >= ul.limit_value;

        return (
          <Alert 
            key={ul.id} 
            className={isExceeded ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}
          >
            <AlertCircle className={cn("h-4 w-4", isExceeded ? "text-red-600" : "text-yellow-600")} />
            <AlertDescription className="ml-2">
              <div className="space-y-2">
                <div>
                  <strong className={isExceeded ? "text-red-900" : "text-yellow-900"}>
                    {limit.name}: {ul.current_usage} / {ul.limit_value} {limit.unit}
                  </strong>
                  <Progress value={percentage} className="mt-2" />
                </div>
                {isExceeded && (
                  <p className="text-sm text-red-800">
                    Du hast dein Limit erreicht. Upgrade für mehr Kapazität.
                  </p>
                )}
                <Button size="sm" asChild>
                  <Link to={createPageUrl('Pricing')}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Upgraden
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}