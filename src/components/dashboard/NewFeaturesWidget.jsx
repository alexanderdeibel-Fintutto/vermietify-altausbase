import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { VfBadge } from '@/components/shared/VfBadge';

export default function NewFeaturesWidget() {
  const features = [
    { title: 'KI-gestützte Mietpreisanalyse', badge: 'Neu', description: 'Optimieren Sie Ihre Mietpreise' },
    { title: 'Automatische BK-Abrechnung', badge: 'Beta', description: 'Sparen Sie Zeit bei der Abrechnung' },
    { title: 'WhatsApp-Integration', badge: 'Neu', description: 'Kommunizieren Sie direkt mit Mietern' }
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
            <div key={index} className="p-3 bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] rounded-lg cursor-pointer transition-colors">
              <div className="flex items-start justify-between mb-1">
                <div className="font-medium text-sm">{feature.title}</div>
                <VfBadge variant="accent">{feature.badge}</VfBadge>
              </div>
              <div className="text-xs text-[var(--theme-text-muted)]">{feature.description}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}