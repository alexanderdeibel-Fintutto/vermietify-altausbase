import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UpgradePrompt({ 
  title = 'Upgrade erforderlich',
  message = 'Diese Funktion ist in Ihrem aktuellen Plan nicht verfügbar.',
  featureName,
  className = ''
}) {
  return (
    <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
      <Sparkles className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <div className="font-medium text-blue-900">{title}</div>
          <div className="text-sm text-blue-700 mt-1">
            {message}
            {featureName && <span className="font-medium"> {featureName}</span>}
          </div>
        </div>
        <Link to={createPageUrl('Pricing')}>
          <Button size="sm" className="ml-4 bg-blue-600 hover:bg-blue-700">
            <Crown className="h-4 w-4 mr-2" />
            Upgraden
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}