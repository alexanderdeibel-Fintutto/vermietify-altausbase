import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function ErrorDisplay({ 
  error, 
  onRetry, 
  fullScreen = false,
  showHomeLink = true 
}) {
  const content = (
    <Card className="p-8 text-center max-w-md mx-auto">
      <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Ein Fehler ist aufgetreten
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        {error?.message || 'Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.'}
      </p>
      <div className="flex gap-3 justify-center">
        {onRetry && (
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Erneut versuchen
          </Button>
        )}
        {showHomeLink && (
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              Zur Startseite
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        {content}
      </div>
    );
  }

  return content;
}