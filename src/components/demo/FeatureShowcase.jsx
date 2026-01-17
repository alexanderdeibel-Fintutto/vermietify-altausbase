import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function FeatureShowcase({ title, description, children, beta = false }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          {beta && (
            <span className="vf-badge vf-badge-warning text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Beta
            </span>
          )}
        </CardTitle>
        {description && (
          <p className="text-sm text-[var(--theme-text-secondary)] mt-2">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}