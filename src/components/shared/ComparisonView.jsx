import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function ComparisonView({ before, after, label }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-sm font-medium text-[var(--theme-text-muted)] mb-4">{label}</div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <div className="text-center">
            <div className="text-xs text-[var(--theme-text-muted)] mb-1">Vorher</div>
            <div className="text-2xl font-bold">{before}</div>
          </div>
          <ArrowRight className="h-6 w-6 text-[var(--theme-text-muted)]" />
          <div className="text-center">
            <div className="text-xs text-[var(--theme-text-muted)] mb-1">Nachher</div>
            <div className="text-2xl font-bold text-[var(--vf-success-600)]">{after}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}