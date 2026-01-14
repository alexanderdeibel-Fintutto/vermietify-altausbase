import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';

class ErrorBoundaryWithLogging extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  async componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });

    // Log error to backend
    try {
      const user = await base44.auth.me().catch(() => null);
      
      const errorLog = await base44.entities.UserActivity.create({
        user_email: user?.email || 'anonymous',
        action: 'ERROR',
        entity_type: 'System',
        details: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      });

      this.setState({ errorId: errorLog.id });

      // Track in analytics
      if (base44.analytics?.track) {
        base44.analytics.track({
          eventName: 'app_error',
          properties: {
            error_message: error.message,
            error_id: errorLog.id,
            component: this.props.componentName || 'Unknown'
          }
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <Card className="max-w-2xl w-full p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Etwas ist schiefgelaufen
                </h2>
                <p className="text-slate-600">
                  Ein unerwarteter Fehler ist aufgetreten. Wir wurden automatisch benachrichtigt.
                </p>
              </div>

              {this.state.errorId && (
                <div className="bg-slate-100 rounded-lg p-4 text-left">
                  <p className="text-xs text-slate-600 mb-2">Fehler-ID für Support:</p>
                  <code className="text-sm font-mono bg-white px-3 py-1 rounded border">
                    {this.state.errorId}
                  </code>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-slate-100 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold mb-2">
                    Fehlerdetails (nur in Entwicklung sichtbar)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-40 bg-white p-3 rounded border">
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                >
                  Zur Startseite
                </Button>
                <Button
                  onClick={this.handleReset}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Erneut versuchen
                </Button>
              </div>

              <p className="text-xs text-slate-500 mt-4">
                Problem besteht weiterhin? Kontaktieren Sie den Support mit der Fehler-ID.
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryWithLogging;