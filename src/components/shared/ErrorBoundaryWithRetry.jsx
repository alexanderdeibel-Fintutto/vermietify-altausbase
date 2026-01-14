import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

class ErrorBoundaryWithRetry extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Optional: Send to error tracking service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.state.retryCount < maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <Card className="max-w-2xl w-full">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    {this.props.title || 'Etwas ist schief gelaufen'}
                  </h2>
                  <p className="text-sm text-slate-600 mb-4">
                    {this.props.message || 'Es ist ein unerwarteter Fehler aufgetreten.'}
                  </p>

                  {this.state.retryCount > 0 && (
                    <p className="text-xs text-slate-500 mb-2">
                      Versuche: {this.state.retryCount} / {maxRetries}
                    </p>
                  )}

                  {this.state.error && (
                    <div className="mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                        className="gap-2 text-slate-600"
                      >
                        {this.state.showDetails ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Details ausblenden
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Details anzeigen
                          </>
                        )}
                      </Button>

                      {this.state.showDetails && (
                        <div className="mt-2 bg-slate-100 rounded-lg p-4 max-h-64 overflow-auto">
                          <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                            {this.state.error.toString()}
                            {this.state.errorInfo?.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {canRetry ? (
                      <Button
                        onClick={this.handleRetry}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Erneut versuchen
                      </Button>
                    ) : (
                      <Button
                        onClick={() => window.location.reload()}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Seite neu laden
                      </Button>
                    )}
                    
                    <Link to={createPageUrl('Dashboard')}>
                      <Button variant="outline" className="gap-2">
                        <Home className="w-4 h-4" />
                        Zur Startseite
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryWithRetry;