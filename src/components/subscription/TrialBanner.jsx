import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TrialBanner() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const subs = await base44.entities.UserSubscription.filter({ user_email: user.email });
      return subs[0];
    },
    enabled: !!user
  });

  if (!subscription || subscription.status !== 'TRIAL') return null;

  const trialEnd = new Date(subscription.trial_end_date);
  const daysLeft = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-[var(--vf-accent-500)] to-[var(--vf-accent-600)] text-white p-4 rounded-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5" />
          <div>
            <div className="font-semibold">
              Noch {daysLeft} Tage kostenlose Testphase
            </div>
            <div className="text-sm opacity-90">
              Upgraden Sie jetzt und sparen Sie 20%
            </div>
          </div>
        </div>
        <Link to={createPageUrl('Pricing')}>
          <Button variant="secondary">
            <Zap className="h-4 w-4 mr-2" />
            Jetzt upgraden
          </Button>
        </Link>
      </div>
    </div>
  );
}