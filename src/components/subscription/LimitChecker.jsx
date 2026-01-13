import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AlertCircle, Lock } from 'lucide-react';

export function LimitChecker({ limitCode, entityToCreate, children }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription } = useQuery({
    queryKey: ['userSubscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.UserSubscription.filter({ 
        user_email: user.email 
      });
      return subs[0];
    },
    enabled: !!user?.email
  });

  const { data: usageLimit } = useQuery({
    queryKey: ['usageLimit', limitCode],
    queryFn: async () => {
      const limits = await base44.entities.UsageLimit.filter({ 
        limit_code: limitCode 
      });
      return limits[0];
    },
    enabled: !!limitCode
  });

  const { data: tierLimit } = useQuery({
    queryKey: ['tierLimit', subscription?.tier_id, usageLimit?.id],
    queryFn: async () => {
      const limits = await base44.entities.TierLimit.filter({ 
        tier_id: subscription.tier_id,
        limit_id: usageLimit.id
      });
      return limits[0];
    },
    enabled: !!subscription?.tier_id && !!usageLimit?.id
  });

  const { data: currentCount = 0 } = useQuery({
    queryKey: ['entityCount', entityToCreate, user?.email],
    queryFn: async () => {
      if (!usageLimit?.entity_to_count) return 0;
      
      const entities = await base44.entities[usageLimit.entity_to_count].filter({
        created_by: user.email
      });
      return entities.length;
    },
    enabled: !!usageLimit?.entity_to_count && !!user?.email
  });

  const limitValue = tierLimit?.limit_value ?? 0;
  const isUnlimited = limitValue === -1;
  const isBlocked = !isUnlimited && currentCount >= limitValue;

  if (!subscription || !usageLimit) {
    return children;
  }

  if (isBlocked && usageLimit.limit_type === 'HARD') {
    return (
      <Alert className="border-red-200 bg-red-50">
        <Lock className="h-4 w-4 text-red-600" />
        <AlertDescription className="ml-2">
          <div className="space-y-2">
            <p className="text-sm text-red-800">
              <strong>Limit erreicht:</strong> Du hast {currentCount} von {limitValue} {usageLimit.unit} genutzt.
            </p>
            <Button size="sm" asChild>
              <Link to={createPageUrl('Pricing')}>
                Jetzt upgraden
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isBlocked && usageLimit.limit_type === 'SOFT') {
    return (
      <>
        <Alert className="border-yellow-200 bg-yellow-50 mb-4">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="ml-2 text-sm text-yellow-800">
            Du hast {currentCount} von {limitValue} {usageLimit.unit} erreicht. 
            Erwäge ein Upgrade für mehr Kapazität.
          </AlertDescription>
        </Alert>
        {children}
      </>
    );
  }

  return children;
}