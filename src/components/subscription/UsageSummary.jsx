import React from 'react';
import { useAllLimits } from '@/components/hooks/useAllLimits';
import { UsageMeter } from './UsageMeter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UsageSummary({ limits, className }) {
  const { data: allLimits, isLoading } = useAllLimits();

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-slate-100 rounded-lg" />;
  }

  const limitKeys = limits || Object.keys(allLimits?.limits || {});

  if (limitKeys.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-medium">Nutzung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {limitKeys.map(key => (
          <UsageMeter key={key} limitKey={key} showUpgradeHint={false} />
        ))}
      </CardContent>
    </Card>
  );
}