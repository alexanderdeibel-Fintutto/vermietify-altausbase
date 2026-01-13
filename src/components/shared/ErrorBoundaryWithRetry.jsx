import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export class ErrorBoundaryWithRetry extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-lg border border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">
                Ein Fehler ist aufgetreten
              </h3>
              <p className="text-sm text-red-700 mb-4">
                {this.state.error?.message || 'Unbekannter Fehler'}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Erneut versuchen ({this.state.retryCount})
                </Button>
                {this.state.retryCount > 2 && (
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Seite neu laden
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}