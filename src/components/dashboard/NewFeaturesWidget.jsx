import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { VfBadge } from '@/components/shared/VfBadge';

export default function NewFeaturesWidget() {
  const features = [
    { name: 'KI-Assistent', description: 'Automatische Dokumentenerstellung', isNew: true },
    { name: 'Mobile App', description: 'Verwalten Sie unterwegs', isNew: true },
    { name: 'API-Zugang', description: 'Integrieren Sie Ihre Tools', isNew: false }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--vf-accent-500)]" />
          Neue Features
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    {feature.name}
                    {feature.isNew && <VfBadge variant="accent">Neu</VfBadge>}
                  </div>
                  <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                    {feature.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}