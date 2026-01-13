import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Crown, ArrowRight } from 'lucide-react';

export default function UpgradePrompt({ 
  title = 'Upgrade erforderlich',
  message = 'Dieses Feature ist in deinem aktuellen Plan nicht verfügbar.',
  tierName
}) {
  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Crown className="h-4 w-4 text-amber-600" />
      <AlertDescription className="ml-2">
        <div className="space-y-3">
          <div>
            <strong className="text-amber-900">{title}</strong>
            <p className="text-sm text-amber-800 mt-1">{message}</p>
            {tierName && (
              <p className="text-xs text-amber-700 mt-1">
                Verfügbar ab Plan: <strong>{tierName}</strong>
              </p>
            )}
          </div>
          <Button size="sm" asChild className="bg-amber-600 hover:bg-amber-700">
            <Link to={createPageUrl('Pricing')}>
              Jetzt upgraden
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}