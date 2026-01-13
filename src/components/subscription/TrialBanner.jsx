import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TrialBanner() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription } = useQuery({
    queryKey: ['userSubscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.UserSubscription.filter({ 
        user_email: user.email 
      });
      return subs[0] || null;
    },
    enabled: !!user?.email
  });

  if (!subscription || subscription.status !== 'TRIAL') {
    return null;
  }

  const trialEnd = new Date(subscription.trial_end_date);
  const today = new Date();
  const daysRemaining = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return null;
  }

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Clock className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm text-blue-900">
          Noch <strong>{daysRemaining} Tage</strong> in Ihrer Testphase
        </span>
        <Link to={createPageUrl('Pricing')}>
          <Button size="sm" variant="outline" className="ml-4">
            <Crown className="h-4 w-4 mr-2" />
            Jetzt upgraden
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}