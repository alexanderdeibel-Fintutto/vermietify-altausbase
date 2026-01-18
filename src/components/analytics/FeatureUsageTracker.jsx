import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfProgress } from '@/components/shared/VfProgress';
import { TrendingUp } from 'lucide-react';

export default function FeatureUsageTracker() {
  const features = [
    { name: 'Objekte', usage: 85, limit: 100 },
    { name: 'Verträge', usage: 42, limit: 50 },
    { name: 'Dokumente', usage: 156, limit: 200 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Feature-Nutzung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {features.map((feature, index) => (
            <div key={index}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{feature.name}</span>
                <span className="text-sm text-[var(--theme-text-muted)]">
                  {feature.usage} / {feature.limit}
                </span>
              </div>
              <VfProgress value={feature.usage} max={feature.limit} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}