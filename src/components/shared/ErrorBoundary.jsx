import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
          <AlertTriangle className="h-16 w-16 text-[var(--vf-error-500)] mb-4" />
          <h2 className="text-2xl font-bold mb-2">Etwas ist schiefgelaufen</h2>
          <p className="text-[var(--theme-text-secondary)] mb-6 text-center max-w-md">
            {this.state.error?.message || 'Ein unerwarteter Fehler ist aufgetreten'}
          </p>
          <Button 
            variant="gradient"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Seite neu laden
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;