import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TrialBanner({ daysLeft }) {
  if (!daysLeft || daysLeft <= 0) return null;

  return (
    <Alert className="bg-[var(--vf-warning-50)] border-[var(--vf-warning-200)]">
      <Clock className="h-4 w-4 text-[var(--vf-warning-600)]" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-[var(--vf-warning-700)]">
          Noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'} Testphase
        </span>
        <Link to={createPageUrl('Pricing')}>
          <Button variant="outline" size="sm">
            Jetzt upgraden
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}