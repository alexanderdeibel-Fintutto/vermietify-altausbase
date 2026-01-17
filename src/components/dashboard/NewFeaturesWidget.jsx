import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { VfBadge } from '@/components/shared/VfBadge';

export default function NewFeaturesWidget() {
  const features = [
    { title: 'KI-Mietersuche', description: 'Automatische Vorschläge', badge: 'Neu' },
    { title: 'Bulk-BK-Abrechnung', description: 'Alle Objekte auf einmal', badge: 'Beta' },
    { title: 'WhatsApp-Integration', description: 'Kommunikation mit Mietern', badge: 'Neu' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Neue Features
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-sm">{feature.title}</div>
                <div className="text-xs text-[var(--theme-text-muted)]">{feature.description}</div>
              </div>
              <VfBadge variant={feature.badge === 'Beta' ? 'warning' : 'accent'}>
                {feature.badge}
              </VfBadge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}