import React from 'react';
import { Link } from 'react-router-dom';
import { useAllLimits } from '@/components/hooks/useAllLimits';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowUpCircle, Infinity } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

export default function LimitsOverviewWidget() {
  const { data: allLimits, isLoading } = useAllLimits();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-2 bg-slate-200 rounded" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-2 bg-slate-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!allLimits?.limits) return null;

  const limitEntries = Object.entries(allLimits.limits);
  const atLimitCount = limitEntries.filter(([_, l]) => !l.unlimited && l.current >= l.max).length;
  const nearLimitCount = limitEntries.filter(([_, l]) => !l.unlimited && l.percentage >= 80 && l.current < l.max).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Nutzungslimits</CardTitle>
          {(atLimitCount > 0 || nearLimitCount > 0) && (
            <Button variant="outline" size="sm" asChild>
              <Link to={createPageUrl('SubscriptionSettings')}>
                <ArrowUpCircle className="h-3 w-3 mr-1" />
                Upgrade
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {limitEntries.slice(0, 4).map(([key, limit]) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{limit.name}</span>
              {limit.unlimited ? (
                <div className="flex items-center gap-1 text-slate-500">
                  <Infinity className="h-3 w-3" />
                  <span className="text-xs">Unbegrenzt</span>
                </div>
              ) : (
                <span className={cn(
                  "font-medium text-xs",
                  limit.current >= limit.max ? 'text-red-600' : 'text-slate-600'
                )}>
                  {limit.current} / {limit.max}
                </span>
              )}
            </div>
            
            {!limit.unlimited && (
              <Progress 
                value={limit.percentage} 
                className={cn(
                  "h-1.5",
                  limit.current >= limit.max && '[&>div]:bg-red-500',
                  limit.percentage >= 80 && limit.current < limit.max && '[&>div]:bg-amber-500'
                )}
              />
            )}
          </div>
        ))}

        {limitEntries.length > 4 && (
          <Button variant="link" size="sm" className="w-full text-xs" asChild>
            <Link to={createPageUrl('SubscriptionSettings')}>
              Alle Limits anzeigen
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}