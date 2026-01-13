import React from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/components/hooks/useSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

export function TrialBanner({ className }) {
  const { data: subscription } = useSubscription();

  if (!subscription?.isTrial || subscription.daysLeftInTrial > 7) {
    return null;
  }

  const daysLeft = subscription.daysLeftInTrial;
  const isUrgent = daysLeft <= 2;

  const getMessage = () => {
    if (daysLeft === 0) return 'Deine Testphase endet heute!';
    if (daysLeft === 1) return 'Deine Testphase endet morgen';
    return `Noch ${daysLeft} Tage in deiner Testphase`;
  };

  return (
    <Alert className={cn(
      "border-blue-200 bg-blue-50",
      isUrgent && "border-orange-200 bg-orange-50",
      className
    )}>
      <Clock className={cn("h-4 w-4", isUrgent ? "text-orange-600" : "text-blue-600")} />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className={cn(
          "font-medium",
          isUrgent ? "text-orange-900" : "text-blue-900"
        )}>
          {getMessage()}
        </span>
        <Button size="sm" asChild>
          <Link to={createPageUrl('SubscriptionSettings')}>
            <Sparkles className="h-4 w-4 mr-2" />
            Jetzt upgraden
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}