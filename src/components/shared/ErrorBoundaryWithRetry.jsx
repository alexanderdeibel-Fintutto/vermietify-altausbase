import React, { Component } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundaryWithRetry extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      retryCount: this.state.retryCount + 1
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">
                    Ein Fehler ist aufgetreten
                  </h3>
                  <p className="text-sm text-red-700 mb-4">
                    {this.state.error?.message || 'Unbekannter Fehler'}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={this.handleRetry}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Erneut versuchen
                    </Button>
                    <Button 
                      onClick={() => window.location.reload()}
                      size="sm"
                      variant="outline"
                    >
                      Seite neu laden
                    </Button>
                  </div>
                  {this.state.retryCount > 0 && (
                    <p className="text-xs text-red-600 mt-2">
                      Versuch {this.state.retryCount + 1}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary(Component) {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundaryWithRetry>
        <Component {...props} />
      </ErrorBoundaryWithRetry>
    );
  };
}

// Hook for retry logic in async operations
export function useRetryableQuery(queryFn, options = {}) {
  const [retryCount, setRetryCount] = React.useState(0);
  const maxRetries = options.maxRetries || 3;

  const wrappedQueryFn = async () => {
    try {
      return await queryFn();
    } catch (error) {
      if (retryCount < maxRetries) {
        console.log(`Retry ${retryCount + 1}/${maxRetries}...`);
        setRetryCount(retryCount + 1);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return wrappedQueryFn();
      }
      throw error;
    }
  };

  return { wrappedQueryFn, retryCount, setRetryCount };
}