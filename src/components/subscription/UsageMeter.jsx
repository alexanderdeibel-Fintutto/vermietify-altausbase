import React from 'react';
import { Link } from 'react-router-dom';
import { useUsageLimit } from '@/components/hooks/useUsageLimit';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Infinity, ArrowUpCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

export function UsageMeter({ 
  limitKey, 
  label, 
  showLabel = true, 
  showUpgradeHint = true, 
  size = 'md',
  className 
}) {
  const { data: usage, isLoading } = useUsageLimit(limitKey);

  if (isLoading) {
    return <div className="animate-pulse h-8 bg-slate-100 rounded" />;
  }

  if (!usage) return null;

  const displayLabel = label || usage.limitName;

  if (usage.unlimited) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-slate-600", className)}>
        {showLabel && <span>{displayLabel}:</span>}
        <Badge variant="secondary" className="gap-1">
          <Infinity className="h-3 w-3" />
          Unbegrenzt
        </Badge>
      </div>
    );
  }

  const progressHeight = { sm: 'h-1', md: 'h-2', lg: 'h-3' }[size] || 'h-2';

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-700">{displayLabel}</span>
          <span className={cn(
            "font-medium",
            usage.isAtLimit ? 'text-red-600' : 'text-slate-600'
          )}>
            {usage.current} / {usage.max}
          </span>
        </div>
      )}

      <Progress
        value={usage.percentage}
        className={cn(
          progressHeight,
          usage.isAtLimit && '[&>div]:bg-red-500',
          usage.isNearLimit && !usage.isAtLimit && '[&>div]:bg-amber-500'
        )}
      />

      {usage.isAtLimit && showUpgradeHint && (
        <div className="flex items-center justify-between gap-2 text-xs text-red-600">
          <span>
            {usage.overageAllowed
              ? `Limit erreicht. Weitere: ${(usage.overagePrice / 100).toFixed(2)}€/Stück`
              : 'Limit erreicht. Bitte upgraden.'}
          </span>
          <Button size="sm" variant="outline" asChild className="h-7 text-xs">
            <Link to={createPageUrl('SubscriptionSettings')}>
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              Upgrade
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}