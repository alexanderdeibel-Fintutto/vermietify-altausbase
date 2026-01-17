import React from 'react';
import { VfAlert } from './VfAlert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LimitWarning({ limitType, current, max }) {
  const percentage = (current / max) * 100;
  
  if (percentage < 80) return null;

  return (
    <VfAlert variant="warning">
      <AlertTriangle className="h-5 w-5" />
      <div className="flex-1">
        <div className="font-semibold">Limit bald erreicht</div>
        <div className="text-sm">
          Sie nutzen {current} von {max} {limitType}. Upgraden Sie Ihren Plan für mehr Kapazität.
        </div>
      </div>
      <Link to={createPageUrl('Pricing')}>
        <Button variant="outline" size="sm">Upgraden</Button>
      </Link>
    </VfAlert>
  );
}