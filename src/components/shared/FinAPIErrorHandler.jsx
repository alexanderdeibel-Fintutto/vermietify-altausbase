import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

export function FinAPIErrorDisplay({ error, onRetry }) {
  const getErrorMessage = (error) => {
    const message = error?.message || error?.toString() || 'Unbekannter Fehler';
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return {
        title: 'Authentifizierung fehlgeschlagen',
        description: 'Die finAPI-Verbindung ist abgelaufen. Bitte verbinden Sie Ihr Konto erneut.',
        action: 'Neu verbinden',
        severity: 'error'
      };
    }
    
    if (message.includes('timeout') || message.includes('network')) {
      return {
        title: 'Netzwerkfehler',
        description: 'Die Verbindung zu finAPI konnte nicht hergestellt werden. Bitte prüfen Sie Ihre Internetverbindung.',
        action: 'Erneut versuchen',
        severity: 'warning'
      };
    }
    
    if (message.includes('rate limit')) {
      return {
        title: 'Zu viele Anfragen',
        description: 'Die finAPI-Rate-Limit wurde erreicht. Bitte warten Sie einige Minuten.',
        action: null,
        severity: 'warning'
      };
    }
    
    if (message.includes('bank')) {
      return {
        title: 'Bankverbindung unterbrochen',
        description: 'Die Verbindung zur Bank wurde unterbrochen. Möglicherweise sind neue Sicherheitsmaßnahmen erforderlich.',
        action: 'Verbindung erneuern',
        severity: 'warning'
      };
    }

    return {
      title: 'finAPI-Fehler',
      description: message,
      action: 'Erneut versuchen',
      severity: 'error'
    };
  };

  const errorInfo = getErrorMessage(error);

  return (
    <Alert className={
      errorInfo.severity === 'error' ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'
    }>
      <AlertCircle className={`w-4 h-4 ${errorInfo.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`} />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <p className="font-medium" style={{ color: errorInfo.severity === 'error' ? '#991b1b' : '#92400e' }}>
              {errorInfo.title}
            </p>
            <p className="text-sm mt-1" style={{ color: errorInfo.severity === 'error' ? '#7f1d1d' : '#78350f' }}>
              {errorInfo.description}
            </p>
          </div>
          
          {errorInfo.action && onRetry && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={onRetry}
                className={errorInfo.severity === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {errorInfo.action}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open('https://finapi.zendesk.com/hc/de', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                finAPI Support
              </Button>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Wrapper for finAPI operations with automatic retry logic
 */
export async function withFinAPIRetry(operation, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication errors
      if (error?.message?.includes('401') || error?.message?.includes('unauthorized')) {
        throw error;
      }
      
      // Exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`finAPI retry ${attempt + 1}/${maxRetries} nach ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}