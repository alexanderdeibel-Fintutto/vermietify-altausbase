import React from 'react';
import { VfBadge } from '@/components/shared/VfBadge';
import { Crown, Zap } from 'lucide-react';

export default function SubscriptionBadge({ planName, status }) {
  const config = {
    STARTER: { label: 'Starter', variant: 'default' },
    BASIC: { label: 'Basic', variant: 'primary' },
    PRO: { label: 'Professional', variant: 'gradient', icon: Zap },
    BUSINESS: { label: 'Business', variant: 'gradient', icon: Crown }
  };

  const planConfig = config[planName] || { label: planName, variant: 'default' };
  const BadgeIcon = planConfig.icon;

  if (status === 'TRIAL') {
    return <VfBadge variant="warning">Testphase</VfBadge>;
  }

  return (
    <VfBadge variant={planConfig.variant}>
      {BadgeIcon && <BadgeIcon className="h-3 w-3 mr-1" />}
      {planConfig.label}
    </VfBadge>
  );
}