import React from 'react';
import { Link } from 'react-router-dom';
import { useFeatureAccess } from '@/components/hooks/useFeatureAccess';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';

export function FeatureGate({ feature, children, fallback, showUpgradePrompt = true }) {
  const { data: access, isLoading } = useFeatureAccess(feature);

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-slate-100 rounded-lg" />;
  }

  if (access?.hasAccess) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const getMessage = () => {
    if (access?.reason === 'addon_required') {
      return `Aktiviere das "${access.requiredAddon}"-Add-On für diese Funktion`;
    }
    if (access?.reason === 'plan_upgrade_required') {
      const planNames = { 1: 'Starter', 2: 'Pro', 3: 'Enterprise' };
      return `Diese Funktion erfordert mindestens den ${planNames[access.requiredPlanLevel] || 'höheren'}-Plan`;
    }
    if (access?.reason === 'no_subscription') {
      return 'Abonnement erforderlich für diese Funktion';
    }
    return 'Upgrade erforderlich';
  };

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Lock className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900 font-medium">Feature nicht verfügbar</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4 mt-2">
        <span className="text-amber-800 text-sm">{getMessage()}</span>
        <Button size="sm" variant="outline" asChild className="shrink-0">
          <Link to={createPageUrl('SubscriptionSettings')}>
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}