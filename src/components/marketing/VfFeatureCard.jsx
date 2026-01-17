import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function VfFeatureCard({ icon: Icon, title, description, highlighted = false }) {
  return (
    <Card className={highlighted ? 'vf-card-premium' : ''}>
      <CardHeader>
        <div className="vf-feature-icon mb-4">
          <Icon className="h-6 w-6" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[var(--theme-text-secondary)] leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}