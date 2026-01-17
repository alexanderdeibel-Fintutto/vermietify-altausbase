import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FeatureGateInline({ featureName, requiredPlan = 'Professional' }) {
  return (
    <div className="bg-[var(--vf-neutral-50)] border border-[var(--theme-border)] rounded-lg p-6 text-center">
      <Lock className="h-12 w-12 mx-auto mb-4 text-[var(--theme-text-muted)]" />
      <h3 className="font-semibold mb-2">{featureName}</h3>
      <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
        Verfügbar im {requiredPlan}-Plan
      </p>
      <Link to={createPageUrl('Pricing')}>
        <Button variant="gradient">Jetzt upgraden</Button>
      </Link>
    </div>
  );
}