import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function ComparisonView({ before, after, label }) {
  return (
    <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-[var(--theme-text-muted)] mb-1">Vorher</div>
          <div className="text-xl font-bold">{before}</div>
        </CardContent>
      </Card>

      <ArrowRight className="h-6 w-6 text-[var(--theme-text-muted)]" />

      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-[var(--theme-text-muted)] mb-1">Nachher</div>
          <div className="text-xl font-bold text-[var(--vf-success-600)]">{after}</div>
        </CardContent>
      </Card>
    </div>
  );
}