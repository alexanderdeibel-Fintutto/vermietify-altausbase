import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-[var(--vf-error-500)] mb-4" />
          <h3 className="text-lg font-semibold mb-2">Etwas ist schiefgelaufen</h3>
          <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
            Bitte laden Sie die Seite neu oder kontaktieren Sie den Support.
          </p>
          <Button onClick={() => window.location.reload()}>
            Seite neu laden
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;