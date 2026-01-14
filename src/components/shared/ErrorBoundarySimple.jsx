import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

class ErrorBoundarySimple extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <Card className="max-w-lg w-full">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Etwas ist schief gelaufen
                </h2>
                <p className="text-sm text-slate-600">
                  Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-slate-100 rounded-lg p-4">
                  <summary className="text-sm font-medium text-slate-700 cursor-pointer mb-2">
                    Fehlerdetails (nur in Entwicklung sichtbar)
                  </summary>
                  <pre className="text-xs text-slate-600 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => window.location.reload()}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Seite neu laden
                </Button>
                <Link to={createPageUrl('Dashboard')}>
                  <Button variant="outline" className="gap-2">
                    <Home className="w-4 h-4" />
                    Zur Startseite
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundarySimple;